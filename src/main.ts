import { doJob, handleDeadCreep } from "controllers/creep"
import { processRoom } from "controllers/room"
import { ErrorMapper } from "utils/ErrorMapper"
import { printHeatMapToTerminal, updateHeatMap } from "utils/heatMap"
import { Job, JobType } from "./types/Job"
import { CreepRole, _CreepMemory, _Memory, _RoomMemory } from "./types/memory"
declare global {
  export interface Memory extends _Memory {}
  export interface CreepMemory extends _CreepMemory {}
  export interface RoomMemory extends _RoomMemory {}

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any
      uuid(): string
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(async () => {
  global.uuid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
  if (Game.time % 10 === 0) console.log(`Current game tick is ${Game.time}`)

  let roomProps = { creepLimit: 10 }

  _.forEach(Game.rooms, r => {
    console.log("processing room ", r.name)
    processRoom(r, roomProps)
  })

  let creeps: Creep[] = []
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      handleDeadCreep(Memory.creeps[name])
      delete Memory.creeps[name]
      continue
    }
    creeps.push(Game.creeps[name])
  }

  creeps = _.sortBy(creeps, c => {
    return CreepRole[c.memory.role]
  }).reverse()

  for (let i = 0; i < creeps.length; i++) {
    console.log("processing creep", creeps[i].name)
    doJob(creeps[i])
    //updateHeatMap(creeps[i])
  }
})
