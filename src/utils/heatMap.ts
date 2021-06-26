export interface HeatMap {
  pos: RoomPosition
  terrain: number
  value: number
  lastUpdate: number
}

export function updateHeatMap(creep: Creep) {
  delete creep.room.memory.heatMap
  if (!creep.room.memory.heatMap) {
    //init
    creep.room.memory.heatMap = []
    let terrain = creep.room.getTerrain()

    for (let y = 0; y < 50; y++)
      for (let x = 0; x < 50; x++) {
        let cell: HeatMap = {
          pos: new RoomPosition(x, y, creep.room.name),
          terrain: terrain.get(x, y),
          value: 0,
          lastUpdate: Game.time
        }
        if (creep.room.memory.heatMap)
          creep.room.memory.heatMap = [...creep.room.memory.heatMap, cell]
      }
  }

  let cell = creep.room.memory.heatMap[creep.pos.y * 50 + creep.pos.x]

  if (Game.time - cell.lastUpdate > 1000) cell.value = 0

  cell.value++
  cell.lastUpdate = Game.time
}

export function printHeatMapToTerminal(room: Room) {
  room = Game.rooms[room.name]
  if (!room) return
  if (!room.memory.heatMap) return
  let roadPlan: RoomPosition[] = []
  let i = 0
  let scale = 1.25
  let msg =
    "<div style='display:flex; flex-direction: column; height:" +
    300 * scale +
    "px; width: " +
    300 * scale +
    "px;'>"
  for (let y = 0; y < 50; y++) {
    msg += "<div style='display:flex; flex-direction: row;'>"
    for (let x = 0; x < 50; x++) {
      let cell = room.memory.heatMap[y * 50 + x]
      let size = 5
      let a = "1"
      let color = "rgba(28, 28, 28," + a + ")"
      if (cell.terrain === TERRAIN_MASK_SWAMP) color = "rgb(10, 30, 10)"
      else if (cell.terrain === TERRAIN_MASK_WALL) color = "black"

      if (cell.value > 0) {
        if (Game.time - cell.lastUpdate > 500) a = "0.25"
        if (Game.time - cell.lastUpdate > 250) a = "0.5"
        if (Game.time - cell.lastUpdate > 100) a = "0.75"
        if (Game.time - cell.lastUpdate > 50) a = "0.9"
        if (Game.time - cell.lastUpdate > 10) a = "1"

        if (cell.value < 100) color = "rgba(80, 180, 80," + a + ")"
        if (cell.value < 80) color = "rgba(70, 150, 70," + a + ")"
        if (cell.value < 60) color = "rgba(80, 120, 60," + a + ")"
        if (cell.value < 40) color = "rgba(90, 100, 60," + a + ")"
        if (cell.value < 20) color = "rgba(100, 80, 40," + a + ")"
        if (cell.value < 10) color = "rgba(120, 40, 40," + a + ")"
      }

      delete room.memory.roadPlanner
      if (!room.memory.roadPlanner) room.memory.roadPlanner = []

      if (cell.value > 100) {
        roadPlan.push(cell.pos)
      }
      msg +=
        "<div style='width:" +
        size * scale +
        "px; height:" +
        size * scale +
        "px; background-color:" +
        color +
        "; '></div>"
    }
    msg += "</div>"
  }
  msg += "</div>"
  console.log("roadplan", roadPlan.length)
  room.memory.roadPlanner = roadPlan
  console.log(msg)
}

export function pruneHeatMap(room: Room) {
  if (!room.memory.heatMap) return
  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 50; x++) {
      let cell = room.memory.heatMap[y * 50 + x]

      if (Game.time - cell.lastUpdate > 500) {
        cell.lastUpdate = Game.time
        cell.value = 0
      }
    }
}
