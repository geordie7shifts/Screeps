export function areAdjacent(a: RoomPosition, b: RoomPosition): boolean {
  for (let y = -1; y <= 1; y++)
    for (let x = -1; x <= 1; x++) {
      if (x === 0 && y === 0) continue
      if (a.y + y === b.y && a.x + x === b.x) return true
    }
  return false
}
