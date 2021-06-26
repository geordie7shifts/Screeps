import { Job, JobType } from "types/Job"
import { CreepRole, JobList } from "types/memory"
import { printHeatMapToTerminal, pruneHeatMap } from "utils/heatMap"

export function processRoom(room: Room, roomProps: any) {
  // Map all mining jobs in room

  if (!room.memory.jobs)
    room.memory.jobs = {
      mining: undefined,
      building: undefined,
      upgrading: undefined
    } as JobList
  //   delete room.memory.jobs.upgrading
  //   delete room.memory.jobs.mining

  if (room.memory.jobs.mining === undefined) {
    room.memory.jobs.mining = []
    let deposits = room.find(FIND_SOURCES)
    for (let d in deposits) {
      let dep = deposits[d]
      createMiningJobs(dep)
    }
  }
  if (room.memory.jobs.upgrading === undefined) {
    room.memory.jobs.upgrading = []
    if (room.controller) createUpgradingJobs(room.controller)
  }

  if (room.memory.jobs.building === undefined) room.memory.jobs.building = []
  if (room.memory.buildOrders === undefined) room.memory.buildOrders = []
  createBuildJobs(room)

  // Spawn New Creeps
  let creeps = room.find(FIND_MY_CREEPS)
  if (creeps.length < roomProps.creepLimit) {
    let num = Math.floor(Math.random() * 1000)
    let spawn = room.find(FIND_MY_SPAWNS)[0]

    let role = CreepRole.All
    if (
      creeps.length > 8 &&
      _.filter(creeps, c => c.memory.role === CreepRole.Upgrader).length <
        roomProps.upgraders
    ) {
      //role = CreepRole.Upgrader
    }

    spawn.spawnCreep([WORK, CARRY, MOVE], "Creep" + num, {
      memory: { role: role, working: true }
    })
  }

  //   if (Game.time % 150 === 0) pruneHeatMap(room)
  //   if (Game.time % 50 === 0) printHeatMapToTerminal(room)
  //   if (room.memory.roadPlanner)
  //     _.forEach(room.memory.roadPlanner, p => room.visual.circle(p))
}

const createMiningJobs = (source: Source) => {
  let { x, y } = source.pos
  let terrain = source.room.lookForAtArea(LOOK_TERRAIN, y - 1, x - 1, y + 1, x + 1, true)

  let spaces = _.filter(terrain, t => t.terrain === "plain").length

  for (let i = 0; i < spaces; i++) {
    let job: Job = {
      id: global.uuid(),
      status: "init",
      source: source,
      dest: new RoomPosition(1, 1, source.room.name),
      description: "energy",
      roomName: source.room.name,
      type: JobType.Mining
    }
    source.room.memory.jobs?.mining?.push(job)
  }
}

const createUpgradingJobs = (controller: StructureController) => {
  let { x, y } = controller.pos

  let terrain = controller.room.lookForAtArea(
    LOOK_TERRAIN,
    y - 1,
    x - 1,
    y + 1,
    x + 1,
    true
  )
  let spaces = _.filter(terrain, t => t.terrain === "plain").length

  for (let i = 0; i < spaces; i++) {
    let job: Job = {
      id: global.uuid(),
      status: "init",
      controller: controller,
      dest: new RoomPosition(1, 1, controller.room.name),
      description: "energy",
      roomName: controller.room.name,
      type: JobType.Upgrading
    }
    controller.room.memory.jobs?.upgrading?.push(job)
  }
}

function createBuildJobs(room: Room) {
  let sites = room.find(FIND_CONSTRUCTION_SITES)
  _.forEach(sites, s => {
    if (!room.memory.buildOrders?.includes(s.id)) {
      let job: Job = {
        id: global.uuid(),
        status: "init",
        site: s,
        description: "Build " + s.structureType,
        type: JobType.Building,
        roomName: room.name
      }
      room.memory.buildOrders?.push(s.id)
      room.memory.jobs?.building?.push(job)
    }
  })
}
