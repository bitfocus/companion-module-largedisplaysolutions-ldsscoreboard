// @ts-nocheck
function dropdown(id: string, label: string, choices: { id: string; label: string }[], fallback = '(empty)') {
	return {
		type: 'dropdown' as const,
		id,
		label,
		choices: choices.length > 0 ? choices : [{ id: '', label: fallback }],
		default: choices[0]?.id ?? '',
	}
}

export function getActions(self: any) {
	const slides = self.getSlideChoices()
	const counters = self.getCounterChoices()
	const timers = self.getTimerChoices()
	const labels = self.getLabelChoices()
	const vectors = self.getVectorChoices()
	const buttons = self.getButtonChoices?.() || []
	return {
		show_slide: {
			name: 'Show Slide',
			options: [dropdown('name', 'Slide', slides)],
			callback: async (action: any) => {
				const name = encodeURIComponent(String(action.options.name ?? ''))
				if (name) await self.makeRequest(`/pcontrol/show_slide/${name}`)
			},
		},
		increment_counter: {
			name: 'Increment Counter',
			options: [dropdown('name', 'Counter', counters)],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				if (name) {
					await self.makeRequest(`/pcontrol/increment_counter/${encodeURIComponent(name)}`)
					await self.refreshSpecific?.([`counter_${name}`])
				}
			},
		},
		decrement_counter: {
			name: 'Decrement Counter',
			options: [dropdown('name', 'Counter', counters)],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				if (name) {
					await self.makeRequest(`/pcontrol/decrement_counter/${encodeURIComponent(name)}`)
					await self.refreshSpecific?.([`counter_${name}`])
				}
			},
		},
		set_counter: {
			name: 'Set Counter Value',
			options: [
				dropdown('name', 'Counter', counters),
				{ type: 'number', id: 'value', label: 'Value', default: 0, min: 0, max: 9999 },
			],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				const value = action.options.value
				if (name) {
					await self.makeRequest(`/pcontrol/set_counter/${encodeURIComponent(name)}/${value}`)
					await self.refreshSpecific?.([`counter_${name}`])
				}
			},
		},
		start_timer: {
			name: 'Start Timer',
			options: [dropdown('name', 'Timer', timers)],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				if (name) {
					await self.makeRequest(`/pcontrol/start_timer/${encodeURIComponent(name)}`)
					await self.refreshSpecific?.([`timer_${name}`])
				}
			},
		},
		stop_timer: {
			name: 'Stop Timer',
			options: [dropdown('name', 'Timer', timers)],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				if (name) {
					await self.makeRequest(`/pcontrol/stop_timer/${encodeURIComponent(name)}`)
					await self.refreshSpecific?.([`timer_${name}`])
				}
			},
		},
		reset_timer: {
			name: 'Reset Timer',
			options: [dropdown('name', 'Timer', timers)],
			callback: async (action: any) => {
				const name = String(action.options.name ?? '')
				if (name) {
					await self.makeRequest(`/pcontrol/reset_timer/${encodeURIComponent(name)}`)
					await self.refreshSpecific?.([`timer_${name}`])
				}
			},
		},
		set_dynamic_label: {
			name: 'Set Dynamic Label',
			options: [
				dropdown('var', 'Dynamic Label', labels),
				{ type: 'textinput', id: 'value', label: 'Value', default: '' },
			],
			callback: async (action: any) => {
				const varName = String(action.options.var ?? '')
				const value = encodeURIComponent(String(action.options.value ?? ''))
				if (varName) {
					await self.makeRequest(`/gc/set_dynamic_label/${encodeURIComponent(varName)}/${value}`)
					await self.refreshSpecific?.([`label_${varName}`])
				}
			},
		},
		reset_automatic_variable: {
			name: 'Reset Automatic Variable',
			options: [
				{
					type: 'dropdown',
					id: 'var',
					label: 'Variable',
					choices: [
						{ id: 'local_team_fauls_resetable', label: 'Local team fouls (resettable)' },
						{ id: 'guest_team_fauls_resetable', label: 'Guest team fouls (resettable)' },
					],
					default: 'local_team_fauls_resetable',
				},
			],
			callback: async (action: any) => {
				const v = action.options.var
				await self.makeRequest(`/gc/reset_automatic_variable/${v}`)
			},
		},
		increment_player_score: {
			name: 'Player Score +',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/increment_player_score/${action.options.team}/${action.options.index}`)
				await self.refreshSpecific?.([`player_${action.options.team}_${action.options.index}_score`])
			},
		},
		decrement_player_score: {
			name: 'Player Score -',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/decrement_player_score/${action.options.team}/${action.options.index}`)
				await self.refreshSpecific?.([`player_${action.options.team}_${action.options.index}_score`])
			},
		},
		increment_player_faults: {
			name: 'Player Fouls +',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/increment_player_fouls/${action.options.team}/${action.options.index}`)
				await self.refreshSpecific?.([`player_${action.options.team}_${action.options.index}_faults`])
			},
		},
		decrement_player_faults: {
			name: 'Player Fouls -',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/decrement_player_fouls/${action.options.team}/${action.options.index}`)
				await self.refreshSpecific?.([`player_${action.options.team}_${action.options.index}_faults`])
			},
		},
		increment_player_cautions: {
			name: 'Player Cautions +',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/increment_player_cautions/${action.options.team}/${action.options.index}`)
			},
		},
		decrement_player_cautions: {
			name: 'Player Cautions -',
			options: [
				{ type: 'dropdown', id: 'team', label: 'Team', choices: [{ id: 'local', label: 'Local' }, { id: 'guest', label: 'Guest' }], default: 'local' },
				{ type: 'number', id: 'index', label: 'Player index', default: 0, min: 0, max: 30 },
			],
			callback: async (action: any) => {
				await self.makeRequest(`/roster/decrement_player_cautions/${action.options.team}/${action.options.index}`)
			},
		},
		click_button: {
			name: 'Click Button',
			options: [dropdown('id', 'Button', buttons)],
			callback: async (action: any) => {
				const id = encodeURIComponent(String(action.options.id ?? ''))
				if (id) await self.makeRequest(`/pcontrol/click_button/${id}`)
			},
		},
		reset_scoreboard: {
			name: 'Reset Scoreboard',
			options: [],
			callback: async () => {
				await self.makeRequest('/gc/reset_active_scoreboard')
				await self.pollValues?.()
			},
		},
		set_vector_element: {
			name: 'Set Vector Element',
			options: [
				dropdown('vector', 'Vector', vectors),
				{ type: 'number', id: 'index', label: 'Index', default: 0, min: 0, max: 100 },
				{ type: 'number', id: 'value', label: 'Value', default: 0 },
			],
			callback: async (action: any) => {
				const vector = encodeURIComponent(String(action.options.vector ?? ''))
				if (vector) await self.makeRequest(`/pcontrol/set_vector_element_value/${vector}/${action.options.index}/${action.options.value}`)
			},
		},
		increment_vector_element: {
			name: 'Increment Vector Element',
			options: [
				dropdown('vector', 'Vector', vectors),
				{ type: 'number', id: 'index', label: 'Index', default: 0, min: 0, max: 100 },
				{ type: 'number', id: 'increment', label: 'Increment', default: 1 },
			],
			callback: async (action: any) => {
				const vector = encodeURIComponent(String(action.options.vector ?? ''))
				if (vector) await self.makeRequest(`/pcontrol/increment_vector_element/${vector}/${action.options.index}/${action.options.increment}`)
			},
		},
	}
}
