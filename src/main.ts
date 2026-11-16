import * as http from 'node:http';
import { InstanceBase, InstanceStatus, runEntrypoint, } from '@companion-module/base';
import { getConfigFields } from './config.js';
import { getActions } from './actions.js';
import { getVariableDefinitions } from './variables.js';
import { getFeedbacks } from './feedbacks.js';
import { getPresets } from './presets.js';
function extractValue(raw) {
    if (!raw) return null;
    try {
        const json = JSON.parse(raw);
        if (json && 'result' in json) return String(json.result);
    } catch {
        // not JSON
    }
    return raw.trim() || null;
}
function parseList(raw) {
    if (!raw) return [];
    try {
        const json = JSON.parse(raw);
        const arr = json?.result || json;
        if (Array.isArray(arr)) {
            return arr.map((item) => {
                if (typeof item === 'string') return item;
                return item.slide_id || item.counter_id || item.timer_id || item.dynamic_label_id || item.vector_id || item.button_id || item.name || item.id || String(item);
            }).filter(Boolean);
        }
    } catch {}
    return raw.split(/\r?\n|,|;/).map((s) => s.trim()).filter((s) => s.length > 0);
}
function parseVectorList(raw) {
    if (!raw) return [];
    try {
        const json = JSON.parse(raw);
        const arr = json?.result || [];
        return arr.map((item) => ({
            id: item.vector_id || item.id,
            length: item.vector_length || 0,
            name: item.vector_name || item.vector_id,
        })).filter((v) => v.id);
    } catch {}
    return [];
}
class LDSscoreboardInstance extends InstanceBase {
    config;
    pollInterval;
    slides = [];
    counters = [];
    timers = [];
    labels = [];
    vectors = [];
    getSlideChoices() {
        return this.slides.map((s) => ({ id: s, label: s }));
    }
    getCounterChoices() {
        return this.counters.map((s) => ({ id: s, label: s }));
    }
    getTimerChoices() {
        return this.timers.map((s) => ({ id: s, label: s }));
    }
    getLabelChoices() {
        return this.labels.map((s) => ({ id: s, label: s }));
    }
    getVectorChoices() {
        return this.vectors.map((s) => ({ id: s, label: s }));
    }
    async init(config) {
        this.config = config;
        this.updateStatus(InstanceStatus.Ok);
        this.setVariableDefinitions(getVariableDefinitions());
        this.setFeedbackDefinitions(getFeedbacks());
        await this.refreshAllLists();
        this.updateActionsAndPresets();
        this.startPolling();
        this.log('info', `LDSscoreboard ready → ${config.host}:${config.port}`);
    }
    async configUpdated(config) {
        this.config = config;
        this.updateStatus(InstanceStatus.Ok);
        await this.refreshAllLists();
        this.updateActionsAndPresets();
        this.startPolling();
    }
    getConfigFields() {
        return getConfigFields();
    }
    async destroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
    updateActionsAndPresets() {
        this.setActionDefinitions(getActions(this));
        const playersLocal = parseInt(this.getVariableValue?.('players_local') || '0', 10) || 0;
        const playersGuest = parseInt(this.getVariableValue?.('players_guest') || '0', 10) || 0;
        this.setPresetDefinitions(getPresets(this.slides, this.counters, this.timers, this.labels, this.vectors, this.buttons || [], playersLocal, playersGuest));
    }
    async refreshAllLists() {
        try {
            const [slides, counters, timers, labels, vectorsRaw, buttons] = await Promise.all([
                this.makeRequest('/pcontrol/list_slides'),
                this.makeRequest('/pcontrol/list_counters'),
                this.makeRequest('/pcontrol/list_timers'),
                this.makeRequest('/gc/list_dynamic_labels'),
                this.makeRequest('/pcontrol/list_vectors'),
                this.makeRequest('/pcontrol/list_buttons'),
            ]);
            this.slides = parseList(slides);
            this.counters = parseList(counters);
            this.timers = parseList(timers);
            this.labels = parseList(labels);
            this.vectorData = parseVectorList(vectorsRaw);
            this.vectors = this.vectorData.map((v) => v.id);
            this.buttons = parseList(buttons);
            if (!this.vectorLengths) this.vectorLengths = {};
            this.vectorData.forEach((v) => { this.vectorLengths[v.id] = v.length; });
            this.updateDynamicVariables();
            this.log('info', `Lists → slides:${this.slides.length} counters:${this.counters.length} timers:${this.timers.length} labels:${this.labels.length} vectors:${this.vectors.length}`);
        }
        catch {
            // keep previous values
        }
    }
    updateDynamicVariables() {
        const defs = [];
        // Team names & scores are always available via automatic variables
        defs.push(
            { variableId: 'local_team_name', name: 'Nom équipe locale' },
            { variableId: 'guest_team_name', name: 'Nom équipe visiteuse' },
            { variableId: 'local_team_score', name: 'Score équipe locale' },
            { variableId: 'guest_team_score', name: 'Score équipe visiteuse' },
            { variableId: 'local_team_fauls', name: 'Fautes équipe locale' },
            { variableId: 'guest_team_fauls', name: 'Fautes équipe visiteuse' },
        );
        // Dynamic from lists
        this.counters.forEach((c) => {
            defs.push({ variableId: `counter_${c}`, name: `Compteur: ${c}` });
        });
        this.timers.forEach((t) => {
            defs.push({ variableId: `timer_${t}`, name: `Timer: ${t}` });
        });
        this.labels.forEach((l) => {
            defs.push({ variableId: `label_${l}`, name: `Label: ${l}` });
        });
        this.vectors.forEach((v) => {
            const len = this.vectorLengths?.[v] || 0;
            defs.push({ variableId: `vector_${v}_length`, name: `Vecteur ${v} longueur` });
            for (let i = 0; i < len; i++) {
                defs.push({ variableId: `vector_${v}_${i}`, name: `Vecteur ${v} [${i}]` });
            }
        });
        defs.push(
            { variableId: 'players_local', name: 'Nombre joueurs local' },
            { variableId: 'players_guest', name: 'Nombre joueurs visiteur' },
        );
        // Player variables 0-14
        for (let i = 0; i < 15; i++) {
            defs.push(
                { variableId: `player_local_${i}_score`, name: `Joueur local ${i} score` },
                { variableId: `player_local_${i}_faults`, name: `Joueur local ${i} fautes` },
                { variableId: `player_local_${i}_cautions`, name: `Joueur local ${i} avert.` },
                { variableId: `player_guest_${i}_score`, name: `Joueur visiteur ${i} score` },
                { variableId: `player_guest_${i}_faults`, name: `Joueur visiteur ${i} fautes` },
                { variableId: `player_guest_${i}_cautions`, name: `Joueur visiteur ${i} avert.` },
            );
        }
        this.setVariableDefinitions(defs);
        this.log('info', `Variables defined: ${defs.length}`);
    }
    startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        const interval = (this.config.refreshInterval || 60) * 1000;
        this.pollInterval = setInterval(async () => {
            await this.pollValuesStaggered();
            await this.refreshAllLists();
            this.updateActionsAndPresets();
        }, interval);
        if (this.config.fastTimers) {
            this.timerInterval = setInterval(() => this.pollTimers(), 1000);
        }
        this.pollValuesStaggered();
    }
    async pollValuesStaggered() {
        // Stagger requests to avoid flooding
        const allKeys = [];
        const requests = [];
        // Build list of all requests (same as pollValues)
        // Then execute with small delays
        await this.pollValues();
    }
    async pollTimers() {
        if (!this.timers || this.timers.length === 0) return;
        try {
            const requests = this.timers.map((t) => this.makeRequest(`/pcontrol/get_timer_time/${encodeURIComponent(t)}`));
            const results = await Promise.all(requests);
            const values = {};
            this.timers.forEach((t, i) => {
                const val = extractValue(results[i]);
                if (val !== null && val !== undefined && val !== '') {
                    values[`timer_${t}`] = val;
                }
            });
            if (Object.keys(values).length > 0) {
                this.setVariableValues(values);
            }
        } catch {
            // silent
        }
    }
    async refreshSpecific(keys) {
        await new Promise((r) => setTimeout(r, 50));
        // Refresh only the given variable keys
        const values = {};
        for (const key of keys) {
            let raw;
            if (key.startsWith('counter_')) {
                raw = await this.makeRequest(`/pcontrol/get_counter_value/${encodeURIComponent(key.slice(8))}`);
            } else if (key.startsWith('timer_')) {
                raw = await this.makeRequest(`/pcontrol/get_timer_time/${encodeURIComponent(key.slice(6))}`);
            } else if (key.startsWith('label_')) {
                raw = await this.makeRequest(`/gc/get_dynamic_label/${encodeURIComponent(key.slice(6))}`);
            } else if (key.startsWith('player_')) {
                const parts = key.split('_');
                const team = parts[1];
                const idx = parts[2];
                const type = parts[3];
                const ep = type === 'score' ? 'get_player_score' : type === 'faults' ? 'get_player_fouls' : 'get_player_cautions';
                raw = await this.makeRequest(`/roster/${ep}/${team}/${idx}`);
            }
            const val = extractValue(raw);
            if (val !== null && val !== undefined && val !== '') values[key] = val;
        }
        if (Object.keys(values).length > 0) this.setVariableValues(values);
    }
    async pollValues() {
        try {
            const requests = [
                this.makeRequest('/gc/get_automatic_variable/local_team_score'),
                this.makeRequest('/gc/get_automatic_variable/guest_team_score'),
                this.makeRequest('/roster/get_local_team_name'),
                this.makeRequest('/roster/get_guest_team_name'),
                this.makeRequest('/gc/get_automatic_variable/local_team_fauls'),
                this.makeRequest('/gc/get_automatic_variable/guest_team_fauls'),
                this.makeRequest('/roster/get_team_players_count/local'),
                this.makeRequest('/roster/get_team_players_count/guest'),
            ];
            const keys = [
                'local_team_score', 'guest_team_score',
                'local_team_name', 'guest_team_name',
                'local_team_fauls', 'guest_team_fauls',
                'players_local', 'players_guest',
            ];
            // Dynamic counters
            this.counters.forEach((c) => {
                requests.push(this.makeRequest(`/pcontrol/get_counter_value/${encodeURIComponent(c)}`));
                keys.push(`counter_${c}`);
            });
            // Dynamic timers are polled separately every 1s
            // Dynamic labels
            this.labels.forEach((l) => {
                requests.push(this.makeRequest(`/gc/get_dynamic_label/${encodeURIComponent(l)}`));
                keys.push(`label_${l}`);
            });
            // Dynamic vectors (real length)
            if (!this.vectorLengths) this.vectorLengths = {};
            for (const v of this.vectors) {
                const lenRaw = await this.makeRequest(`/pcontrol/get_vector_length/${encodeURIComponent(v)}`);
                const len = parseInt(extractValue(lenRaw) || '0', 10) || 0;
                this.vectorLengths[v] = len;
                requests.push(Promise.resolve(lenRaw));
                keys.push(`vector_${v}_length`);
                for (let i = 0; i < len; i++) {
                    requests.push(this.makeRequest(`/pcontrol/get_vector_element_value/${encodeURIComponent(v)}/${i}`));
                    keys.push(`vector_${v}_${i}`);
                }
            }
            // Player stats (only real count if roster polling enabled)
            if (this.config.pollRoster !== false) {
                const localCount = parseInt(extractValue(results?.[6]) || '0', 10) || 0;
                const guestCount = parseInt(extractValue(results?.[7]) || '0', 10) || 0;
                for (let i = 0; i < Math.min(localCount, 20); i++) {
                    requests.push(this.makeRequest(`/roster/get_player_score/local/${i}`));
                    keys.push(`player_local_${i}_score`);
                    requests.push(this.makeRequest(`/roster/get_player_fouls/local/${i}`));
                    keys.push(`player_local_${i}_faults`);
                    requests.push(this.makeRequest(`/roster/get_player_cautions/local/${i}`));
                    keys.push(`player_local_${i}_cautions`);
                }
                for (let i = 0; i < Math.min(guestCount, 20); i++) {
                    requests.push(this.makeRequest(`/roster/get_player_score/guest/${i}`));
                    keys.push(`player_guest_${i}_score`);
                    requests.push(this.makeRequest(`/roster/get_player_fouls/guest/${i}`));
                    keys.push(`player_guest_${i}_faults`);
                    requests.push(this.makeRequest(`/roster/get_player_cautions/guest/${i}`));
                    keys.push(`player_guest_${i}_cautions`);
                }
            }
            const results = await Promise.all(requests);
            const values = {};
            keys.forEach((key, i) => {
                const val = extractValue(results[i]);
                if (val !== null && val !== undefined && val !== '') {
                    values[key] = val;
                }
            });
            this.log('info', `Player0 score: ${values['player_local_0_score'] ?? 'empty'}`);
            if (Object.keys(values).length > 0) {
                this.setVariableValues(values);
            }
        }
        catch {
            // silent
        }
    }
    async makeRequest(path) {
        const url = `http://${this.config.host}:${this.config.port}${path}`;
        this.log('info', `→ ${url}`);
        return new Promise((resolve) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    const code = res.statusCode ?? 0;
                    if (code >= 200 && code < 400) {
                        resolve(data.trim());
                    }
                    else {
                        this.log('warn', `← HTTP ${code} for ${path}`);
                        resolve();
                    }
                });
            });
            req.on('error', (err) => {
                this.log('error', `Request failed: ${err.message}`);
                this.updateStatus(InstanceStatus.ConnectionFailure);
                resolve();
            });
            req.setTimeout(3000, () => {
                req.destroy();
                resolve();
            });
        });
    }
}
runEntrypoint(LDSscoreboardInstance, []);
