// Simple method that returns a random emoji from list
export function getRandomEmoji() {
	const emojiList = [
		"😭",
		"😄",
		"😌",
		"🤓",
		"😎",
		"😤",
		"🤖",
		"😶‍🌫️",
		"🌏",
		"📸",
		"💿",
		"👋",
		"🌊",
		"✨",
	];
	return emojiList[Math.floor(Math.random() * emojiList.length)];
}
