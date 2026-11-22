// @ts-nocheck
import * as http from 'node:http'
import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { getConfigFields } from './config.js'
import { getActions } from './actions.js'
import { getVariableDefinitions } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { getPresets } from './presets.js'

function extractValue(raw: string | undefined | null): string | null {
	if (!raw) return null
	try {
		const json = JSON.parse(raw)
		if (json && 'result' in json) {
			const val = json.result
			return val === null || val === undefined ? null : String(val)
		}
	} catch {}
	return raw.trim() || null
}

function parseList(raw: string | undefined | null): string[] {
	if (!raw) return []
	try {
		const json = JSON.parse(raw)
		const arr = json?.result || json
		if (Array.isArray(arr)) {
			return arr.map((item: any) => {
				if (typeof item === 'string') return item
				return item.slide_id || item.counter_id || item.timer_id || item.dynamic_label_id || item.vector_id || item.button_id || item.name || item.id || String(item)
			}).filter(Boolean)
		}
	} catch {}
	return raw.split(/\r?\n|,|;/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
}

function parseVectorList(raw: string | undefined | null): { id: string; length: number; name: string }[] {
	if (!raw) return []
	try {
		const json = JSON.parse(raw)
		const arr = json?.result || []
		return arr.map((item: any) => ({
			id: item.vector_id || item.id,
			length: item.vector_length || 0,
			name: item.vector_name || item.vector_id,
		})).filter((v: any) => v.id)
	} catch { return [] }
}

function parseButtonList(raw: string | undefined | null): { id: string; text: string }[] {
	if (!raw) return []
	try {
		const json = JSON.parse(raw)
		const arr = json?.result || []
		return arr.map((item: any) => ({
			id: item.button_id || item.id,
			text: item.text || item.button_id || item.id,
		})).filter((b: any) => b.id)
	} catch { return [] }
}

interface ModuleConfig {
	host: string
	port: number
	refreshInterval: number
	fastTimers: boolean
	pollRoster: boolean
}

class LDSscoreboardInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	pollInterval: ReturnType<typeof setInterval> | undefined
	timerInterval: ReturnType<typeof setInterval> | undefined
	slides: string[] = []
	counters: string[] = []
	timers: string[] = []
	labels: string[] = []
	vectors: string[] = []
	buttons: { id: string; text: string }[] = []
	vectorData: { id: string; length: number; name: string }[] = []
	vectorLengths: Record<string, number> = {}

	getSlideChoices() { return this.slides.map((s) => ({ id: s, label: s })) }
	getCounterChoices() { return this.counters.map((s) => ({ id: s, label: s })) }
	getTimerChoices() { return this.timers.map((s) => ({ id: s, label: s })) }
	getLabelChoices() { return this.labels.map((s) => ({ id: s, label: s })) }
	getVectorChoices() { return this.vectors.map((s) => ({ id: s, label: s })) }
	getButtonChoices() { return this.buttons.map((b) => ({ id: b.id, label: b.text })) }

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		this.setVariableDefinitions(getVariableDefinitions())
		this.setFeedbackDefinitions(getFeedbacks(this))
		await this.refreshAllLists()
		await this.pollValues()
		this.updateActionsAndPresets()
		this.startPolling()
		this.log('info', `LDSscoreboard ready → ${config.host}:${config.port}`)
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		await this.refreshAllLists()
		await this.pollValues()
		this.updateActionsAndPresets()
		this.startPolling()
	}

	getConfigFields() { return getConfigFields() }

	async destroy(): Promise<void> {
		if (this.pollInterval) clearInterval(this.pollInterval)
		if (this.timerInterval) clearInterval(this.timerInterval)
	}

	updateActionsAndPresets(): void {
		this.setActionDefinitions(getActions(this))
		const playersLocal = parseInt(String(this.getVariableValue('players_local') || '0'), 10) || 0
		const playersGuest = parseInt(String(this.getVariableValue('players_guest') || '0'), 10) || 0
		this.setPresetDefinitions(getPresets(this.slides, this.counters, this.timers, this.labels, this.vectors, this.buttons, playersLocal, playersGuest))
	}

	async refreshAllLists(): Promise<void> {
		try {
			const [slides, counters, timers, labels, vectorsRaw, buttons] = await Promise.all([
				this.makeRequest('/pcontrol/list_slides'),
				this.makeRequest('/pcontrol/list_counters'),
				this.makeRequest('/pcontrol/list_timers'),
				this.makeRequest('/gc/list_dynamic_labels'),
				this.makeRequest('/pcontrol/list_vectors'),
				this.makeRequest('/pcontrol/list_buttons'),
			])
			if (slides) this.slides = parseList(slides)
			if (counters) this.counters = parseList(counters)
			if (timers) this.timers = parseList(timers)
			if (labels) this.labels = parseList(labels)
			if (vectorsRaw) {
				this.vectorData = parseVectorList(vectorsRaw)
				this.vectors = this.vectorData.map((v) => v.id)
				this.vectorData.forEach((v) => { this.vectorLengths[v.id] = v.length })
			}
			if (buttons) this.buttons = parseButtonList(buttons)
			this.updateDynamicVariables()
		} catch {}
	}

	updateDynamicVariables(): void {
		const defs: { variableId: string; name: string }[] = []
		defs.push(
			{ variableId: 'local_team_name', name: 'Local team name' },
			{ variableId: 'guest_team_name', name: 'Guest team name' },
			{ variableId: 'local_team_score', name: 'Local team score' },
			{ variableId: 'guest_team_score', name: 'Guest team score' },
			{ variableId: 'local_team_fauls', name: 'Local team fouls' },
			{ variableId: 'guest_team_fauls', name: 'Guest team fouls' },
			{ variableId: 'players_local', name: 'Local players count' },
			{ variableId: 'players_guest', name: 'Guest players count' },
		)
		this.counters.forEach((c) => { defs.push({ variableId: `counter_${c}`, name: `Counter: ${c}` }) })
		this.timers.forEach((t) => { defs.push({ variableId: `timer_${t}`, name: `Timer: ${t}` }) })
		this.labels.forEach((l) => { defs.push({ variableId: `label_${l}`, name: `Label: ${l}` }) })
		this.vectors.forEach((v) => {
			const len = this.vectorLengths[v] || 0
			defs.push({ variableId: `vector_${v}_length`, name: `Vector ${v} length` })
			for (let i = 0; i < len; i++) {
				defs.push({ variableId: `vector_${v}_${i}`, name: `Vector ${v} [${i}]` })
			}
		})
		for (let i = 0; i < 20; i++) {
			defs.push(
				{ variableId: `player_local_${i}_score`, name: `Local player ${i} score` },
				{ variableId: `player_local_${i}_faults`, name: `Local player ${i} fouls` },
				{ variableId: `player_local_${i}_cautions`, name: `Local player ${i} cautions` },
				{ variableId: `player_guest_${i}_score`, name: `Guest player ${i} score` },
				{ variableId: `player_guest_${i}_faults`, name: `Guest player ${i} fouls` },
				{ variableId: `player_guest_${i}_cautions`, name: `Guest player ${i} cautions` },
			)
		}
		this.setVariableDefinitions(defs)
	}

	startPolling(): void {
		if (this.pollInterval) clearInterval(this.pollInterval)
		if (this.timerInterval) clearInterval(this.timerInterval)
		const interval = (this.config.refreshInterval || 60) * 1000
		this.pollInterval = setInterval(async () => {
			await this.pollValues()
			await this.refreshAllLists()
			this.updateActionsAndPresets()
		}, interval)
		if (this.config.fastTimers) {
			this.timerInterval = setInterval(() => this.pollTimers(), 1000)
		}
	}

	async pollTimers(): Promise<void> {
		if (!this.timers || this.timers.length === 0) return
		try {
			const requests = this.timers.map((t) => this.makeRequest(`/pcontrol/get_timer_time/${encodeURIComponent(t)}`))
			const results = await Promise.all(requests)
			const values: Record<string, string> = {}
			this.timers.forEach((t, i) => {
				const val = extractValue(results[i])
				if (val !== null && val !== undefined && val !== '') values[`timer_${t}`] = val
			})
			if (Object.keys(values).length > 0) this.setVariableValues(values)
		} catch {}
	}

	async refreshSpecific(keys: string[]): Promise<void> {
		await new Promise((r) => setTimeout(r, 50))
		const values: Record<string, string> = {}
		for (const key of keys) {
			let raw: string | undefined
			if (key.startsWith('counter_')) {
				raw = await this.makeRequest(`/pcontrol/get_counter_value/${encodeURIComponent(key.slice(8))}`)
			} else if (key.startsWith('timer_')) {
				raw = await this.makeRequest(`/pcontrol/get_timer_time/${encodeURIComponent(key.slice(6))}`)
			} else if (key.startsWith('label_')) {
				raw = await this.makeRequest(`/gc/get_dynamic_label/${encodeURIComponent(key.slice(6))}`)
			} else if (key.startsWith('player_')) {
				const parts = key.split('_')
				const team = parts[1], idx = parts[2], type = parts[3]
				const ep = type === 'score' ? 'get_player_score' : type === 'faults' ? 'get_player_fouls' : 'get_player_cautions'
				raw = await this.makeRequest(`/roster/${ep}/${team}/${idx}`)
			}
			const val = extractValue(raw)
			if (val !== null && val !== undefined && val !== '') values[key] = val
		}
		if (Object.keys(values).length > 0) this.setVariableValues(values)
	}

	async pollValues(): Promise<void> {
		try {
			const requests: Promise<string | undefined>[] = [
				this.makeRequest('/gc/get_automatic_variable/local_team_score'),
				this.makeRequest('/gc/get_automatic_variable/guest_team_score'),
				this.makeRequest('/roster/get_local_team_name'),
				this.makeRequest('/roster/get_guest_team_name'),
				this.makeRequest('/gc/get_automatic_variable/local_team_fauls'),
				this.makeRequest('/gc/get_automatic_variable/guest_team_fauls'),
				this.makeRequest('/roster/get_team_players_count/local'),
				this.makeRequest('/roster/get_team_players_count/guest'),
			]
			const keys: string[] = [
				'local_team_score', 'guest_team_score', 'local_team_name', 'guest_team_name',
				'local_team_fauls', 'guest_team_fauls', 'players_local', 'players_guest',
			]
			this.counters.forEach((c) => { requests.push(this.makeRequest(`/pcontrol/get_counter_value/${encodeURIComponent(c)}`)); keys.push(`counter_${c}`) })
			this.timers.forEach((t) => { requests.push(this.makeRequest(`/pcontrol/get_timer_time/${encodeURIComponent(t)}`)); keys.push(`timer_${t}`) })
			this.labels.forEach((l) => { requests.push(this.makeRequest(`/gc/get_dynamic_label/${encodeURIComponent(l)}`)); keys.push(`label_${l}`) })
			for (const v of this.vectors) {
				const len = this.vectorLengths[v] || 0
				for (let i = 0; i < len; i++) {
					requests.push(this.makeRequest(`/pcontrol/get_vector_element_value/${encodeURIComponent(v)}/${i}`))
					keys.push(`vector_${v}_${i}`)
				}
			}
			if (this.config.pollRoster !== false) {
				const baseResults = await Promise.all(requests.slice(0, 8))
				const localCount = parseInt(extractValue(baseResults[6]) || '0', 10) || 0
				const guestCount = parseInt(extractValue(baseResults[7]) || '0', 10) || 0
				for (let i = 0; i < Math.min(localCount, 20); i++) {
					requests.push(this.makeRequest(`/roster/get_player_score/local/${i}`)); keys.push(`player_local_${i}_score`)
					requests.push(this.makeRequest(`/roster/get_player_fouls/local/${i}`)); keys.push(`player_local_${i}_faults`)
					requests.push(this.makeRequest(`/roster/get_player_cautions/local/${i}`)); keys.push(`player_local_${i}_cautions`)
				}
				for (let i = 0; i < Math.min(guestCount, 20); i++) {
					requests.push(this.makeRequest(`/roster/get_player_score/guest/${i}`)); keys.push(`player_guest_${i}_score`)
					requests.push(this.makeRequest(`/roster/get_player_fouls/guest/${i}`)); keys.push(`player_guest_${i}_faults`)
					requests.push(this.makeRequest(`/roster/get_player_cautions/guest/${i}`)); keys.push(`player_guest_${i}_cautions`)
				}
			}
			const results = await Promise.all(requests)
			const values: Record<string, string> = {}
			keys.forEach((key, i) => {
				const val = extractValue(results[i])
				if (val !== null && val !== undefined && val !== '') values[key] = val
			})
			if (Object.keys(values).length > 0) this.setVariableValues(values)
		} catch {}
	}

	async makeRequest(path: string): Promise<string | undefined> {
		const url = `http://${this.config.host}:${this.config.port}${path}`
		this.log('debug', `→ ${url}`)
		return new Promise((resolve) => {
			const req = http.get(url, (res) => {
				let data = ''
				res.on('data', (chunk) => (data += chunk))
				res.on('end', () => {
					const code = res.statusCode ?? 0
					if (code >= 200 && code < 400) {
						this.updateStatus(InstanceStatus.Ok)
						resolve(data.trim())
					} else {
						this.log('warn', `← HTTP ${code} for ${path}`)
						resolve(undefined)
					}
				})
			})
			req.on('error', (err) => {
				this.log('error', `Request failed: ${err.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				resolve(undefined)
			})
			req.setTimeout(3000, () => { req.destroy(); resolve(undefined) })
		})
	}
}

runEntrypoint(LDSscoreboardInstance, [])