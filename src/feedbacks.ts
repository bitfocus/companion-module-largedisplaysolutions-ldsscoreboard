// @ts-nocheck
export function getFeedbacks(self: any) {
	return {
		counter_above: {
			type: 'boolean',
			name: 'Counter > value',
			description: 'True when the selected counter is above the given value',
			defaultStyle: { bgcolor: 0x00ff00, color: 0x000000 },
			options: [
				{ type: 'textinput', id: 'name', label: 'Counter name', default: '' },
				{ type: 'number', id: 'value', label: 'Value', default: 0, min: 0, max: 9999 },
			],
			callback: (feedback: any) => {
				const name = feedback.options.name
				const threshold = feedback.options.value
				const current = parseInt(String(self.getVariableValue?.(`counter_${name}`) || '0'), 10)
				return current > threshold
			},
		},
		timer_running: {
			type: 'boolean',
			name: 'Timer running',
			description: 'True when the selected timer is running (not 00:00)',
			defaultStyle: { bgcolor: 0x00ff00, color: 0x000000 },
			options: [{ type: 'textinput', id: 'name', label: 'Timer name', default: '' }],
			callback: (feedback: any) => {
				const name = feedback.options.name
				const time = self.getVariableValue?.(`timer_${name}`) || '00:00'
				return time !== '00:00' && time !== '00:00:00' && time !== ''
			},
		},
	}
}
