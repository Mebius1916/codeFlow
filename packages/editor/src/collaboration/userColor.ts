const USER_COLORS = [
  '#f56565', // red-500
  '#ed8936', // orange-500
  '#ecc94b', // yellow-400
  '#48bb78', // green-500
  '#38b2ac', // teal-500
  '#4299e1', // blue-500
  '#667eea', // indigo-500
  '#9f7aea', // purple-500
  '#ed64a6', // pink-500
]

export const getUserColor = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % USER_COLORS.length
  return USER_COLORS[index]
}
