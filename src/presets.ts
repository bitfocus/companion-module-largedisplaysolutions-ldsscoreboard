// @ts-nocheck
import { CompanionPresetDefinitions } from '@companion-module/base'

export function getPresets(
	slides: string[] = [],
	counters: string[] = [],
	timers: string[] = [],
	labels: string[] = [],
	vectors: string[] = [],
	buttons: { id: string; text: string }[] = [],
	playersLocal = 0,
	playersGuest = 0,
): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	slides.forEach((slide) => {
		const id = `slide_${slide.replace(/[^a-zA-Z0-9]/g, '_')}`
		presets[id] = {
			category: 'Slides',
			name: `Show: ${slide}`,
			type: 'button',
			style: { text: slide.length > 12 ? slide.substring(0, 10) + '…' : slide, size: '14', color: 0xffffff, bgcolor: 0x333333 },
			steps: [{ down: [{ actionId: 'show_slide', options: { name: slide } }], up: [] }],
			feedbacks: [],
		}
	})

	counters.forEach((counter) => {
		const base = counter.replace(/[^a-zA-Z0-9]/g, '_')
		presets[`counter_${base}_display`] = {
			category: 'Counters',
			name: `Display ${counter}`,
			type: 'button',
			style: { text: `${counter}\\n$(LDSscoreboard:counter_${counter})`, size: '14', color: 0xffffff, bgcolor: 0x003366 },
			steps: [],
			feedbacks: [],
		}
		presets[`counter_${base}_plus`] = {
			category: 'Counters',
			name: `${counter} +1`,
			type: 'button',
			style: { text: `${counter}\\n+1`, size: '14', color: 0xffffff, bgcolor: 0x0066cc },
			steps: [{ down: [{ actionId: 'increment_counter', options: { name: counter } }], up: [] }],
			feedbacks: [],
		}
		presets[`counter_${base}_minus`] = {
			category: 'Counters',
			name: `${counter} -1`,
			type: 'button',
			style: { text: `${counter}\\n-1`, size: '14', color: 0xffffff, bgcolor: 0xcc6600 },
			steps: [{ down: [{ actionId: 'decrement_counter', options: { name: counter } }], up: [] }],
			feedbacks: [],
		}
	})

	timers.forEach((timer) => {
		const base = timer.replace(/[^a-zA-Z0-9]/g, '_')
		presets[`timer_${base}_display`] = {
			category: 'Timers',
			name: `Display ${timer}`,
			type: 'button',
			style: { text: `${timer}\\n$(LDSscoreboard:timer_${timer})`, size: '14', color: 0xffffff, bgcolor: 0x003300 },
			steps: [],
			feedbacks: [],
		}
		presets[`timer_${base}_start`] = {
			category: 'Timers',
			name: `Start ${timer}`,
			type: 'button',
			style: { text: `START\\n${timer}`, size: '12', color: 0x000000, bgcolor: 0x00ff00 },
			steps: [{ down: [{ actionId: 'start_timer', options: { name: timer } }], up: [] }],
			feedbacks: [],
		}
		presets[`timer_${base}_stop`] = {
			category: 'Timers',
			name: `Stop ${timer}`,
			type: 'button',
			style: { text: `STOP\\n${timer}`, size: '12', color: 0xffffff, bgcolor: 0xff6600 },
			steps: [{ down: [{ actionId: 'stop_timer', options: { name: timer } }], up: [] }],
			feedbacks: [],
		}
		presets[`timer_${base}_reset`] = {
			category: 'Timers',
			name: `Reset ${timer}`,
			type: 'button',
			style: { text: `RESET\\n${timer}`, size: '12', color: 0xffffff, bgcolor: 0x666666 },
			steps: [{ down: [{ actionId: 'reset_timer', options: { name: timer } }], up: [] }],
			feedbacks: [],
		}
	})

	presets['var_local_team_score'] = {
		category: 'Variables',
		name: 'Local Score',
		type: 'button',
		style: { text: 'LOCAL\\n$(LDSscoreboard:local_team_score)', size: '18', color: 0xffffff, bgcolor: 0x0000ff },
		steps: [],
		feedbacks: [],
	}
	presets['var_guest_team_score'] = {
		category: 'Variables',
		name: 'Guest Score',
		type: 'button',
		style: { text: 'GUEST\\n$(LDSscoreboard:guest_team_score)', size: '18', color: 0xffffff, bgcolor: 0xff0000 },
		steps: [],
		feedbacks: [],
	}

	if (Array.isArray(vectors)) {
		vectors.forEach((vector) => {
			const base = vector.replace(/[^a-zA-Z0-9]/g, '_')
			presets[`vector_${base}_display`] = {
				category: 'Vectors',
				name: `Display ${vector} [0]`,
				type: 'button',
				style: { text: `${vector}\\n$(LDSscoreboard:vector_${vector}_0)`, size: '12', color: 0xffffff, bgcolor: 0x333333 },
				steps: [],
				feedbacks: [],
			}
		})
	}

	labels.forEach((label) => {
		const base = label.replace(/[^a-zA-Z0-9]/g, '_')
		presets[`label_${base}_display`] = {
			category: 'Variables',
			name: `Label: ${label}`,
			type: 'button',
			style: { text: `${label}\\n$(LDSscoreboard:label_${label})`, size: '12', color: 0xffffff, bgcolor: 0x333366 },
			steps: [],
			feedbacks: [],
		}
	})

	if (Array.isArray(buttons)) {
		buttons.forEach((btn) => {
			const base = btn.id.replace(/[^a-zA-Z0-9]/g, '_')
			presets[`button_${base}`] = {
				category: 'Buttons',
				name: `Button: ${btn.text}`,
				type: 'button',
				style: { text: btn.text, size: '14', color: 0xffffff, bgcolor: 0x444444 },
				steps: [{ down: [{ actionId: 'click_button', options: { id: btn.id } }], up: [] }],
				feedbacks: [],
			}
		})
	}

	presets['reset_scoreboard'] = {
		category: 'General',
		name: 'Reset Scoreboard',
		type: 'button',
		style: { text: 'RESET\\nSCOREBOARD', size: '12', color: 0xffffff, bgcolor: 0x990000 },
		steps: [{ down: [{ actionId: 'reset_scoreboard', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['display_local_team'] = {
		category: 'Roster',
		name: 'Local Team Name',
		type: 'button',
		style: { text: 'LOCAL\\n$(LDSscoreboard:local_team_name)', size: '14', color: 0xffffff, bgcolor: 0x001166 },
		steps: [],
		feedbacks: [],
	}
	presets['display_guest_team'] = {
		category: 'Roster',
		name: 'Guest Team Name',
		type: 'button',
		style: { text: 'GUEST\\n$(LDSscoreboard:guest_team_name)', size: '14', color: 0xffffff, bgcolor: 0x660011 },
		steps: [],
		feedbacks: [],
	}

	// Roster player presets - only if we have a count
	const localCount = Math.max(0, Math.min(playersLocal || 0, 20))
	for (let i = 0; i < localCount; i++) {
		presets[`roster_local_${i}_score_plus`] = { category: 'Roster Local', name: `L${i} Score +`, type: 'button', style: { text: `L${i}\\nSCORE +`, size: '12', color: 0xffffff, bgcolor: 0x0000aa }, steps: [{ down: [{ actionId: 'increment_player_score', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_score_minus`] = { category: 'Roster Local', name: `L${i} Score -`, type: 'button', style: { text: `L${i}\\nSCORE -`, size: '12', color: 0xffffff, bgcolor: 0x000066 }, steps: [{ down: [{ actionId: 'decrement_player_score', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_score_display`] = { category: 'Roster Local', name: `L${i} Score`, type: 'button', style: { text: `L${i}\\n$(LDSscoreboard:player_local_${i}_score)`, size: '12', color: 0xffffff, bgcolor: 0x001188 }, steps: [], feedbacks: [] }
		presets[`roster_local_${i}_faults_plus`] = { category: 'Roster Local', name: `L${i} Fouls +`, type: 'button', style: { text: `L${i}\\nFOULS +`, size: '12', color: 0xffffff, bgcolor: 0x660066 }, steps: [{ down: [{ actionId: 'increment_player_faults', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_faults_minus`] = { category: 'Roster Local', name: `L${i} Fouls -`, type: 'button', style: { text: `L${i}\\nFOULS -`, size: '12', color: 0xffffff, bgcolor: 0x330033 }, steps: [{ down: [{ actionId: 'decrement_player_faults', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_faults_display`] = { category: 'Roster Local', name: `L${i} Fouls`, type: 'button', style: { text: `L${i}\\nF $(LDSscoreboard:player_local_${i}_faults)`, size: '12', color: 0xffffff, bgcolor: 0x440044 }, steps: [], feedbacks: [] }
		presets[`roster_local_${i}_cautions_plus`] = { category: 'Roster Local', name: `L${i} Cautions +`, type: 'button', style: { text: `L${i}\\nCAUT +`, size: '12', color: 0xffffff, bgcolor: 0xaa6600 }, steps: [{ down: [{ actionId: 'increment_player_cautions', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_cautions_minus`] = { category: 'Roster Local', name: `L${i} Cautions -`, type: 'button', style: { text: `L${i}\\nCAUT -`, size: '12', color: 0xffffff, bgcolor: 0x663300 }, steps: [{ down: [{ actionId: 'decrement_player_cautions', options: { team: 'local', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_local_${i}_cautions_display`] = { category: 'Roster Local', name: `L${i} Cautions`, type: 'button', style: { text: `L${i}\\nA $(LDSscoreboard:player_local_${i}_cautions)`, size: '12', color: 0xffffff, bgcolor: 0x884400 }, steps: [], feedbacks: [] }
	}

	const guestCount = Math.max(0, Math.min(playersGuest || 0, 20))
	for (let i = 0; i < guestCount; i++) {
		presets[`roster_guest_${i}_score_plus`] = { category: 'Roster Guest', name: `G${i} Score +`, type: 'button', style: { text: `G${i}\\nSCORE +`, size: '12', color: 0xffffff, bgcolor: 0xaa0000 }, steps: [{ down: [{ actionId: 'increment_player_score', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_score_minus`] = { category: 'Roster Guest', name: `G${i} Score -`, type: 'button', style: { text: `G${i}\\nSCORE -`, size: '12', color: 0xffffff, bgcolor: 0x660000 }, steps: [{ down: [{ actionId: 'decrement_player_score', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_score_display`] = { category: 'Roster Guest', name: `G${i} Score`, type: 'button', style: { text: `G${i}\\n$(LDSscoreboard:player_guest_${i}_score)`, size: '12', color: 0xffffff, bgcolor: 0x880000 }, steps: [], feedbacks: [] }
		presets[`roster_guest_${i}_faults_plus`] = { category: 'Roster Guest', name: `G${i} Fouls +`, type: 'button', style: { text: `G${i}\\nFOULS +`, size: '12', color: 0xffffff, bgcolor: 0x660033 }, steps: [{ down: [{ actionId: 'increment_player_faults', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_faults_minus`] = { category: 'Roster Guest', name: `G${i} Fouls -`, type: 'button', style: { text: `G${i}\\nFOULS -`, size: '12', color: 0xffffff, bgcolor: 0x330011 }, steps: [{ down: [{ actionId: 'decrement_player_faults', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_faults_display`] = { category: 'Roster Guest', name: `G${i} Fouls`, type: 'button', style: { text: `G${i}\\nF $(LDSscoreboard:player_guest_${i}_faults)`, size: '12', color: 0xffffff, bgcolor: 0x440022 }, steps: [], feedbacks: [] }
		presets[`roster_guest_${i}_cautions_plus`] = { category: 'Roster Guest', name: `G${i} Cautions +`, type: 'button', style: { text: `G${i}\\nCAUT +`, size: '12', color: 0xffffff, bgcolor: 0xaa4400 }, steps: [{ down: [{ actionId: 'increment_player_cautions', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_cautions_minus`] = { category: 'Roster Guest', name: `G${i} Cautions -`, type: 'button', style: { text: `G${i}\\nCAUT -`, size: '12', color: 0xffffff, bgcolor: 0x662200 }, steps: [{ down: [{ actionId: 'decrement_player_cautions', options: { team: 'guest', index: i } }], up: [] }], feedbacks: [] }
		presets[`roster_guest_${i}_cautions_display`] = { category: 'Roster Guest', name: `G${i} Cautions`, type: 'button', style: { text: `G${i}\\nA $(LDSscoreboard:player_guest_${i}_cautions)`, size: '12', color: 0xffffff, bgcolor: 0x883300 }, steps: [], feedbacks: [] }
	}

	return presets
}
