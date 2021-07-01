import { MiningSpot } from "types/memory"
import { areAdjacent } from "./tiles"

export function setRoomMiningSpots(room: Room) {
  const sources = room.find(FIND_SOURCES)
  const creeps = room.find(FIND_MY_CREEPS)
  _.forEach(sources, s => {
    if (!room.memory.sources) room.memory.sources = []
    if (room.memory.sources.filter(x => x.sourceId === s.id).length === 0) {
      let spot = newMiningSpot(s)
      if (!lookForContainer(spot)) findBestContainerLocation(spot)
      room.memory.sources.push(spot)
    }
  })
}

function newMiningSpot(source: Source): MiningSpot {
  // Calculate total possible miners at once
  let { x, y } = source.pos
  let terrain = source.room.lookForAtArea(LOOK_TERRAIN, y - 1, x - 1, y + 1, x + 1, true)
  let spaces = _.filter(terrain, t => t.terrain === "plain")

  let miningSpot = {
    sourceId: source.id,
    pos: source.pos,
    hasDedicatedMiner: false,
    spots: _.map(spaces, s => {
      return new RoomPosition(s.x, s.y, source.room.name)
    }),
    hasContainer: false,
    containerId: ""
  } as MiningSpot

  return miningSpot
}

function lookForContainer(spot: MiningSpot): boolean {
  if (spot.hasContainer) return true

  const containers = spot.pos.findInRange(FIND_STRUCTURES, 2, {
    filter: { structureType: STRUCTURE_CONTAINER }
  }) as StructureContainer[]

  const planned = spot.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
    filter: { structureType: "container" }
  }) as []

  if (containers.length === 0 && planned.length === 0) return false

  if (containers.length > 0) {
    spot.hasContainer = true
    spot.containerId = containers[0].id
  }
  return true
}

function findBestContainerLocation(spot: MiningSpot) {
  const room = Game.rooms[spot.pos.roomName]
  const spawn = spot.pos.findClosestByRange(FIND_MY_SPAWNS)
  const terrain = new Room.Terrain(spot.pos.roomName)

  let candidates = []
  let min = 100
  // Find possible spots
  for (let y = spot.pos.y - 2, row = 0; y < spot.pos.y + 2; y++, row++)
    for (let x = spot.pos.x - 2, col = 0; x < spot.pos.x + 2; x++, col++) {
      if (row > 0 && row < 4 && col > 0 && col < 4) continue

      if (terrain.get(x, y) === 0) {
        let pos = new RoomPosition(x, y, spot.pos.roomName)
        let loc = { pos: pos, points: 0, dist: 0 }

        // Find adjacent mining spots, if any
        for (let i = 0; i < spot.spots.length; i++)
          if (areAdjacent(pos, spot.spots[i])) loc.points += 3

        loc.dist = pos.getRangeTo(spawn?.pos.x ?? pos.x, spawn?.pos.y ?? pos.y)

        if (loc.dist < min) min = loc.dist

        candidates.push(loc)
      }
    }

  // Adjust scores for distance from spawn
  for (let i = 0; i < candidates.length; i++)
    candidates[i].points -= candidates[i].dist - min

  let maxScore = 0
  for (let i = 0; i < candidates.length; i++)
    if (candidates[i].points > maxScore) maxScore = candidates[i].points

  let finalLocation = candidates.filter(c => c.points === maxScore)[0]

  room.createConstructionSite(
    finalLocation.pos.x,
    finalLocation.pos.y,
    STRUCTURE_CONTAINER
  )
}
