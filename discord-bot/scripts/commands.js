export const TEST_COMMAND = {
	name: "hello",
	description: "Say hello",
	type: 1,
};

export const ROLLADICE_COMMAND = {
	name: "rolladice",
	description: "Roll a dice",
	type: 1,
	options: [
		{
			name: "sides",
			description: "Number of sides on the dice to roll",
			type: 4,
			required: true,
			min_value: 1,
			max_value: 24,
		},
	],
};

export const ALL_COMMANDS = [TEST_COMMAND, ROLLADICE_COMMAND];
