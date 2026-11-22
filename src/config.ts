import { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	refreshInterval: number
	fastTimers: boolean
	pollRoster: boolean
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address of LDSscoreboard PC',
			width: 8,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'HTTP Port',
			width: 4,
			min: 1,
			max: 65535,
			default: 8086,
		},
		{
			type: 'number',
			id: 'refreshInterval',
			label: 'Refresh interval (seconds)',
			width: 6,
			min: 5,
			max: 300,
			default: 60,
		},
		{
			type: 'checkbox',
			id: 'fastTimers',
			label: 'Update timers every second',
			width: 6,
			default: true,
		},
		{
			type: 'checkbox',
			id: 'pollRoster',
			label: 'Poll roster / player data',
			width: 6,
			default: true,
		},
	]
}
