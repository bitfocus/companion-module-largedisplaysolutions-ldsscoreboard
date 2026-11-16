function dropdown(id, label, choices, fallback = '(liste vide)') {
    return {
        type: 'dropdown',
        id,
        label,
        choices: choices.length > 0 ? choices : [{ id: '', label: fallback }],
        default: choices[0]?.id ?? '',
    };
}
export function getActions(self) {
    const slides = self.getSlideChoices();
    const counters = self.getCounterChoices();
    const timers = self.getTimerChoices();
    const labels = self.getLabelChoices();
    const vectors = self.getVectorChoices();
    return {
        // === SLIDES ===
        show_slide: {
            name: 'Slides : Afficher une slide',
            options: [dropdown('name', 'Slide', slides)],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                if (name)
                    await self.makeRequest(`/pcontrol/show_slide/${name}`);
                await self.pollValues?.();
            },
        },
        // === COUNTERS ===
        increment_counter: {
            name: 'Compteurs : Incrémenter',
            options: [dropdown('name', 'Compteur', counters)],
            callback: async (action) => {
                const name = String(action.options.name ?? '');
                self.log('info', `Increment counter: "${name}"`);
                if (name) await self.makeRequest(`/pcontrol/increment_counter/${encodeURIComponent(name)}`);
                await self.refreshSpecific?.([`counter_${name}`]);
            },
        },
        decrement_counter: {
            name: 'Compteurs : Décrémenter',
            options: [dropdown('name', 'Compteur', counters)],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                if (name)
                    await self.makeRequest(`/pcontrol/decrement_counter/${name}`);
                await self.pollValues?.();
            },
        },
        set_counter: {
            name: 'Compteurs : Définir valeur',
            options: [
                dropdown('name', 'Compteur', counters),
                { type: 'number', id: 'value', label: 'Valeur', default: 0, min: 0, max: 9999 },
            ],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                const value = action.options.value;
                if (name)
                    await self.makeRequest(`/pcontrol/set_counter/${name}/${value}`);
                await self.refreshSpecific?.([`counter_${name}`]);
            },
        },
        // === TIMERS ===
        start_timer: {
            name: 'Timers : Démarrer',
            options: [dropdown('name', 'Timer', timers)],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                if (name)
                    await self.makeRequest(`/pcontrol/start_timer/${name}`);
                await self.pollValues?.();
            },
        },
        stop_timer: {
            name: 'Timers : Arrêter',
            options: [dropdown('name', 'Timer', timers)],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                if (name)
                    await self.makeRequest(`/pcontrol/stop_timer/${name}`);
                await self.pollValues?.();
            },
        },
        reset_timer: {
            name: 'Timers : Reset',
            options: [dropdown('name', 'Timer', timers)],
            callback: async (action) => {
                const name = encodeURIComponent(String(action.options.name ?? ''));
                if (name)
                    await self.makeRequest(`/pcontrol/reset_timer/${name}`);
                await self.refreshSpecific?.([`timer_${name}`]);
            },
        },
        // === LABELS ===
        set_dynamic_label: {
            name: 'Labels : Définir',
            options: [
                dropdown('var', 'Label dynamique', labels),
                { type: 'textinput', id: 'value', label: 'Valeur', default: '' },
            ],
            callback: async (action) => {
                const varName = encodeURIComponent(String(action.options.var ?? ''));
                const value = encodeURIComponent(String(action.options.value ?? ''));
                if (varName)
                    await self.makeRequest(`/gc/set_dynamic_label/${varName}/${value}`);
                await self.pollValues?.();
            },
        },
        reset_automatic_variable: {
            name: 'Labels : Reset variable automatique',
            options: [
                {
                    type: 'dropdown',
                    id: 'var',
                    label: 'Variable',
                    choices: [
                        { id: 'local_team_fauls_resetable', label: 'Fautes locale (resettable)' },
                        { id: 'guest_team_fauls_resetable', label: 'Fautes visiteuse (resettable)' },
                    ],
                    default: 'local_team_fauls_resetable',
                },
            ],
            callback: async (action) => {
                const v = action.options.var;
                await self.makeRequest(`/gc/reset_automatic_variable/${v}`);
                await self.pollValues?.();
            },
        },
        // === ROSTER ===
        increment_player_score: {
            name: 'Roster : Score +',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/increment_player_score/${action.options.team}/${action.options.index}`);
                await self.pollValues?.();
            },
        },
        decrement_player_score: {
            name: 'Roster : Score -',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/decrement_player_score/${action.options.team}/${action.options.index}`);
                await self.refreshSpecific?.([`player_${action.options.team}_${action.options.index}_score`]);
            },
        },
        increment_player_faults: {
            name: 'Roster : Fautes +',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/increment_player_fouls/${action.options.team}/${action.options.index}`);
                await self.pollValues?.();
            },
        },
        decrement_player_faults: {
            name: 'Roster : Fautes -',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/decrement_player_fouls/${action.options.team}/${action.options.index}`);
                await self.pollValues?.();
            },
        },
        increment_player_cautions: {
            name: 'Roster : Avertissements +',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/increment_player_cautions/${action.options.team}/${action.options.index}`);
                await self.pollValues?.();
            },
        },
        decrement_player_cautions: {
            name: 'Roster : Avertissements -',
            options: [
                { type: 'dropdown', id: 'team', label: 'Équipe', choices: [{ id: 'local', label: 'Locale' }, { id: 'guest', label: 'Visiteuse' }], default: 'local' },
                { type: 'number', id: 'index', label: 'Index joueur', default: 0, min: 0, max: 30 },
            ],
            callback: async (action) => {
                await self.makeRequest(`/roster/decrement_player_cautions/${action.options.team}/${action.options.index}`);
                await self.pollValues?.();
            },
        },
        // === BOUTONS PERSONNALISÉS ===
        click_button: {
            name: 'Boutons : Cliquer',
            options: [dropdown('id', 'Bouton', self.getButtonChoices?.() || [])],
            callback: async (action) => {
                const id = encodeURIComponent(String(action.options.id ?? ''));
                if (id) await self.makeRequest(`/pcontrol/click_button/${id}`);
            },
        },
        // === RESET ===
        reset_scoreboard: {
            name: 'Reset scoreboard',
            options: [],
            callback: async () => {
                await self.makeRequest('/gc/reset_active_scoreboard');
                await self.pollValues?.();
            },
        },
        set_vector_element: {
            name: 'Vecteurs : Définir élément',
            options: [
                dropdown('vector', 'Vecteur', vectors),
                { type: 'number', id: 'index', label: 'Index', default: 0, min: 0, max: 100 },
                { type: 'number', id: 'value', label: 'Valeur', default: 0 },
            ],
            callback: async (action) => {
                const vector = encodeURIComponent(String(action.options.vector ?? ''));
                if (vector)
                    await self.makeRequest(`/pcontrol/set_vector_element_value/${vector}/${action.options.index}/${action.options.value}`);
                await self.pollValues?.();
            },
        },
        increment_vector_element: {
            name: 'Vecteurs : Incrémenter élément',
            options: [
                dropdown('vector', 'Vecteur', vectors),
                { type: 'number', id: 'index', label: 'Index', default: 0, min: 0, max: 100 },
                { type: 'number', id: 'increment', label: 'Incrément', default: 1 },
            ],
            callback: async (action) => {
                const vector = encodeURIComponent(String(action.options.vector ?? ''));
                if (vector)
                    await self.makeRequest(`/pcontrol/increment_vector_element/${vector}/${action.options.index}/${action.options.increment}`);
                await self.pollValues?.();
            },
        },
    };
}
