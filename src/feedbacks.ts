export function getFeedbacks() {
    return {
        counter_above: {
            type: 'boolean',
            name: 'Compteur > valeur',
            description: 'True si un compteur est supérieur à la valeur',
            options: [
                { type: 'textinput', id: 'name', label: 'Nom du compteur', default: 'score_local' },
                { type: 'number', id: 'value', label: 'Seuil', default: 0, min: 0, max: 9999 },
            ],
            defaultStyle: { bgcolor: 0xff0000, color: 0xffffff },
            callback: async (feedback) => {
                return false;
            },
        },
        timer_running: {
            type: 'boolean',
            name: 'Timer en cours',
            description: 'Indication visuelle (basée sur dernière action)',
            options: [{ type: 'textinput', id: 'name', label: 'Nom du timer', default: 'main' }],
            defaultStyle: { bgcolor: 0x00ff00, color: 0x000000 },
            callback: async () => false,
        },
    };
}
