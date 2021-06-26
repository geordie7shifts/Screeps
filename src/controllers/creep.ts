import { Job, JobType } from "types/Job"
import { CreepRole } from "types/memory"

export function doJob(creep: Creep) {
  if (creep.memory.job) {
    switch (creep.memory.job.type) {
      case JobType.Mining:
        return doMiningJob(creep)
      case JobType.Upgrading:
        return doUpgradingJob(creep)
      case JobType.Building:
        return doBuildingJob(creep)
    }
  } else {
    findJob(creep)
  }
}

function doMiningJob(creep: Creep) {
  if (!creep.memory.job) return
  let freeCapacity = creep.store.getFreeCapacity()
  if (freeCapacity > 0 && creep.memory.working) {
    if (creep.memory.job.source && creep.memory.working) {
      // Go get resource
      let source = Game.getObjectById(creep.memory.job.source.id) as Source
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source)
      }
    }
  } else if (freeCapacity === 0 || !creep.memory.working) {
    creep.memory.working = false
    let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)
    // Bring it back
    if (spawn && creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
      creep.moveTo(spawn)

    // Job complete
    if (freeCapacity === creep.store.getCapacity()) {
      spawn?.renewCreep(creep)
      creep.memory.working = true
    }
  }
}

function doUpgradingJob(creep: Creep) {
  if (!creep.memory.job) return
  if (!creep.memory.job.controller) return
  let freeCapacity = creep.store.getFreeCapacity()
  if (freeCapacity >= 0 && creep.memory.working) {
    let controller = Game.getObjectById(
      creep.memory.job.controller.id
    ) as StructureController

    if (creep.transfer(controller, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
      creep.moveTo(controller)

    if (freeCapacity === creep.store.getCapacity()) creep.memory.working = false
  } else if (freeCapacity === creep.store.getCapacity() || !creep.memory.working) {
    let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)
    if (
      spawn &&
      spawn.store.energy >= 225 &&
      creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(spawn)
    }

    if (freeCapacity === 0) {
      spawn?.renewCreep(creep)
      creep.memory.working = true
    }
  }
}

function doBuildingJob(creep: Creep) {
  if (!creep.memory.job) return
  if (!creep.memory.job.site) return

  if (!creep.memory.job.target) {
    let sources = creep.room
      .find(FIND_STRUCTURES)
      .filter(
        s =>
          s.structureType === "extension" ||
          s.structureType === "spawn" ||
          (s.structureType === "storage" && s.store.energy >= 30)
      )
      .sort((a, b) => {
        let aa = a as StructureExtension | StructureSpawn | StructureStorage
        let bb = b as StructureExtension | StructureSpawn | StructureStorage
        return aa.store.energy - bb.store.energy
      }) as StructureExtension[] | StructureSpawn[] | StructureStorage[]

    creep.memory.job.target = sources[0]
  }

  //let target = creep.pos.findClosestByRange(sources)
}

export function findJob(creep: Creep, room?: Room) {
  if (!room) room = creep.room

  if (!creep.memory.job) {
    let jobs = findJobsByRole(room, creep.memory.role)

    creep.memory.job = jobs.pop()
    creep.memory.working = true
  }
}

function findJobsByRole(room: Room, role: CreepRole): Job[] {
  switch (role) {
    case CreepRole.All:
      if (room.memory.jobs?.mining && room.memory.jobs.mining.length > 0)
        return room.memory.jobs.mining
      if (room.memory.jobs?.building && room.memory.jobs.building.length > 0)
        return room.memory.jobs?.building
      if (room.memory.jobs?.upgrading && room.memory.jobs.upgrading.length > 0)
        return room.memory.jobs?.upgrading

      return []
    case CreepRole.Miner:
      return room.memory.jobs?.mining ?? []
    case CreepRole.Upgrader:
      return room.memory.jobs?.upgrading ?? []
    case CreepRole.Builder:
    case CreepRole.Hauler:
    default:
      return []
  }
}

export function handleDeadCreep(creep: CreepMemory) {
  if (creep.job) {
    let room = Game.rooms[creep.job.roomName]

    switch (creep.job.type) {
      case JobType.Mining:
        room.memory.jobs?.mining?.push({ ...creep.job, status: "init" })
        break
      case JobType.Upgrading:
        room.memory.jobs?.upgrading?.push({ ...creep.job, status: "init" })
        break
      default:
        break
    }
  }
}

function releaseJob(creep: CreepMemory) {
  if (!creep.job) return
  let room = Game.rooms[creep.job.roomName]

  switch (creep.job.type) {
    case JobType.Building:
      room.memory.jobs?.building?.push(creep.job)
  }

  delete creep.job
}
