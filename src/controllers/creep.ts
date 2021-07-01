import { KeyObject } from "crypto"
import { filter } from "lodash"
import { Job, JobType } from "types/Job"
import { CreepRole } from "types/memory"

export function doJob(creep: Creep) {
  if (creep.memory.job) {
    switch (creep.memory.job.type) {
      case JobType.Mining:
        doMiningJob(creep)
      case JobType.Upgrading:
        doUpgradingJob(creep)
      case JobType.Building:
        doBuildingJob(creep)
      default:
    }
    if (creep.memory.job?.status === "complete") {
      if (creep.memory.job.type === JobType.Building) creep.memory.job = undefined
      else if (creep.memory.role === CreepRole.All) releaseJob(creep.memory)
    }
  } else {
    findJob(creep)
  }
}

/*******************************************************************************
 *                  \ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /
 *      Mine         X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X
 *                  / \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \
 *******************************************************************************/
function doMiningJob(creep: Creep): void {
  if (!creep.memory.job) return
  if (!creep.memory.job.source) return

  if (!creep.memory.job.status) creep.memory.job.status = "init"

  if (creep.memory.job.status === "init")
    if (creep.store.getFreeCapacity() >= 50) creep.memory.job.status = "mine"
    else creep.memory.job.status = "unload"

  /// MINING
  if (creep.memory.job.status === "mine") {
    // Go get resource
    let source = Game.getObjectById(creep.memory.job.source.id) as Source

    let m = creep.harvest(source)

    if (m === ERR_NOT_IN_RANGE) creep.moveTo(source)

    if (creep.store.getFreeCapacity() === 0) creep.memory.job.status = "unload"
  }

  // UNLOADING
  if (creep.memory.job.status === "unload") {
    if (!creep.memory.job.targets || !creep.memory.job.target)
      if (
        !getNextEnergySink(creep, {
          filter: s => {
            if (!s) return false

            let i = Game.getObjectById(s.id) as
              | StructureSpawn
              | StructureExtension
              | StructureStorage
              | StructureTower
              | StructureContainer
            let e = i.store.energy
            let limit = 50

            if (i.structureType === "extension") limit = EXTENSION_ENERGY_CAPACITY[5]
            else if (i.structureType === "spawn") limit = SPAWN_ENERGY_CAPACITY
            else if (i.structureType === "storage") limit = STORAGE_CAPACITY
            else if (i.structureType === "tower") limit = TOWER_CAPACITY
            else if (i.structureType === "container") limit = CONTAINER_CAPACITY

            if (e < limit) return true

            return false
          },
          refresh: true
        })
      )
        creep.memory.job.status = "overflow"

    if (creep.memory.job.status !== "overflow") {
      if (!creep.memory.job.target) return

      let target = Game.getObjectById(creep.memory.job.target.id) as StructureSpawn

      let c = creep.transfer(target, RESOURCE_ENERGY)
      if (c === ERR_NOT_IN_RANGE) creep.moveTo(target)
      else if (c === ERR_FULL) {
        creep.memory.job.target = creep.memory.job.targets?.shift()
      }

      // Job complete
      if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
        if (creep.memory.role === CreepRole.Miner) creep.memory.job.status = "mine"
        else creep.memory.job.status = "complete"
      }
    }
  }
  if (creep.memory.job.status === "overflow") {
    let target = Game.rooms[creep.room.name].controller as StructureController

    let t = creep.transfer(target, RESOURCE_ENERGY)
    if (t === ERR_NOT_IN_RANGE) creep.moveTo(target)

    // Job complete
    if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
      if (creep.memory.role === CreepRole.Miner) creep.memory.job.status = "mine"
      else creep.memory.job.status = "complete"
    }
  }
}

/*******************************************************************************
 *                  \ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /
 *      Upgrade      X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X
 *                  / \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \
 *******************************************************************************/
function doUpgradingJob(creep: Creep) {
  if (!creep.memory.job) return
  if (!creep.memory.job.controller) return

  let freeCapacity = creep.store.getFreeCapacity()

  if (!creep.memory.job.status) creep.memory.job.status = "init"

  if (creep.memory.job.status === "init") {
    if (creep.store.energy >= 30) creep.memory.job.status = "upgrade"
    else creep.memory.job.status = "load"
  }

  if (creep.memory.job.status === "upgrade") {
    let controller = Game.getObjectById(
      creep.memory.job.controller.id
    ) as StructureController

    if (creep.transfer(controller, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
      creep.moveTo(controller)

    // job complete
    if (freeCapacity === creep.store.getCapacity()) {
      if (creep.memory.role === CreepRole.Upgrader) creep.memory.job.status = "load"
      else creep.memory.job.status = "complete"
    }
  } else if (creep.memory.job.status === "load") {
    if (!creep.memory.job.target)
      if (!getNextEnergySource(creep, { filter: s => s.store.energy >= 50 })) {
        creep.memory.job.status = "complete"
        return
      }

    if (!creep.memory.job.target) return

    let target = Game.getObjectById(creep.memory.job.target.id) as Structure

    let w = creep.withdraw(target, RESOURCE_ENERGY)

    if (w === OK) creep.memory.job.status = "upgrade"
    else if (w === ERR_NOT_IN_RANGE) creep.moveTo(target)
    else if (w === ERR_NOT_ENOUGH_RESOURCES) creep.memory.job.target = undefined

    if (freeCapacity === 0) {
      creep.memory.job.status = "upgrade"
    }
  }
}

/*******************************************************************************
 *                  \ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /\ /
 *      BUILD        X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X  X
 *                  / \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \/ \
 *******************************************************************************/
function doBuildingJob(creep: Creep) {
  if (!creep.memory.job) return
  if (!creep.memory.job.site) return

  if (!creep.memory.job.status) creep.memory.job.status = "init"

  if (creep.memory.job.status === "init") {
    if (creep.store.energy >= 50) creep.memory.job.status = "build"
    else creep.memory.job.status = "load"
  }

  if (creep.memory.job.status === "load") {
    // Find a target to get energy from
    if (!creep.memory.job.target || !creep.memory.job.targets)
      if (
        !getNextEnergySource(creep, {
          filter: s => s.store.energy >= 50,
          refresh: true
        })
      ) {
        return
      }

    if (!creep.memory.job.target) return

    let target = Game.getObjectById(creep.memory.job.target.id) as Structure

    let w = creep.withdraw(target, RESOURCE_ENERGY)

    if (w === OK) creep.memory.job.status = "build"
    else if (w === ERR_NOT_IN_RANGE) creep.moveTo(target)
    else if (w === ERR_NOT_ENOUGH_RESOURCES) creep.memory.job.target = undefined
  }
  // end load

  // Build
  if (creep.memory.job.status === "build") {
    if (!creep.memory.job.site) return
    let target = Game.getObjectById(creep.memory.job.site.id) as ConstructionSite

    if (!target) creep.memory.job.status = "complete"

    let b = creep.build(target)

    if (target && target.progress === target.progressTotal)
      creep.memory.job.status = "complete"
    else if (creep.store.energy === 0) {
      if (creep.memory.role === CreepRole.Builder) creep.memory.job.status = "load"
      else releaseJob(creep.memory)
    } else if (b === ERR_NOT_IN_RANGE)
      creep.moveTo(target, {
        visualizePathStyle: {
          fill: "transparent",
          stroke: "#fff",
          lineStyle: "dashed",
          strokeWidth: 0.15,
          opacity: 0.1
        }
      })
    else if (b === ERR_NOT_ENOUGH_RESOURCES) creep.memory.job.status = "load"
  }
}

export function findJob(creep: Creep, room?: Room) {
  if (!room) room = creep.room

  if (!creep.memory.job) {
    let jobs = findJobsByRole(room, creep.memory.role)

    creep.memory.job = jobs.pop()
  }
}

function findJobsByRole(room: Room, role: CreepRole): Job[] {
  if (!room.memory.jobs) return []

  switch (role) {
    case CreepRole.All:
      if (room.memory.jobs.mining && room.memory.jobs.mining.length > 0)
        return room.memory.jobs.mining
      if (room.memory.jobs.building && room.memory.jobs.building.length > 0)
        return room.memory.jobs.building
      if (room.memory.jobs.upgrading && room.memory.jobs.upgrading.length > 0)
        return room.memory.jobs.upgrading

      return []
    case CreepRole.Miner:
      return room.memory.jobs.mining ?? []
    case CreepRole.Upgrader:
      return room.memory.jobs.upgrading ?? []
    case CreepRole.Builder:
    case CreepRole.Hauler:
    default:
      return []
  }
}

export function handleDeadCreep(creep: CreepMemory) {
  releaseJob(creep)
}

function releaseJob(creep: CreepMemory) {
  if (!creep.job) return
  let room = Game.rooms[creep.job.roomName]
  let type = JobType[creep.job.type].toLowerCase()
  // Push creep's job back into array for that type
  room.memory.jobs?.[type]?.push({
    ...creep.job,
    status: "init",
    target: undefined,
    targets: undefined
  })
  delete creep.job
}

function findEnergySinks(room: Room, filter?: any): [] {
  let sources = room
    .find(FIND_STRUCTURES)
    .filter(
      s =>
        (s.structureType === "spawn" ||
          s.structureType === "tower" ||
          s.structureType === "container" ||
          s.structureType === "extension" ||
          s.structureType === "storage") &&
        (filter?.(s) ?? true)
    ) as []

  return sources
}

function findEnergySources(room: Room, filter?: any) {
  let sources = room
    .find(FIND_STRUCTURES)
    .filter(
      s =>
        (s.structureType === "spawn" ||
          s.structureType === "container" ||
          s.structureType === "extension" ||
          s.structureType === "storage") &&
        (filter?.(s) ?? true)
    )

  return sources
}

interface EnergySinkProps {
  filter?(s: any): boolean
  refresh?: boolean
}

function getNextEnergySink(creep: Creep, props?: EnergySinkProps): boolean {
  if (!creep.memory.job) return false

  let refresh = false
  if (props) refresh = props.refresh ?? false

  if (!creep.memory.job.targets || (creep.memory.job.targets.length === 0 && refresh)) {
    creep.memory.job.targets = findEnergySinks(creep.room, props?.filter)
    if (creep.memory.job.targets.length === 0) return false
  }

  let target = creep.pos.findClosestByRange(
    creep.memory.job.targets.filter(s => (props?.filter ? props.filter(s) : true))
  )
  creep.memory.job.targets.shift()

  if (target) creep.memory.job.target = target
  else creep.memory.job.target = undefined

  return true
}

function getStructure(creep: Creep, types: StructureConstant[]) {}

function getNextEnergySource(creep: Creep, props?: EnergySinkProps): boolean {
  if (!creep.memory.job) return false

  let refresh = false
  if (props) refresh = props.refresh ?? false

  if (!creep.memory.job.targets || (creep.memory.job.targets.length === 0 && refresh)) {
    creep.memory.job.targets = findEnergySources(creep.room, props?.filter)
    if (creep.memory.job.targets.length === 0) return false
  }

  let target = creep.pos.findClosestByRange(
    creep.memory.job.targets.filter(s => (props?.filter ? props.filter(s) : true))
  )
  creep.memory.job.targets.shift()

  if (target) creep.memory.job.target = target
  else creep.memory.job.target = undefined

  return true
}

const EnergySources = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_CONTAINER,
  STRUCTURE_STORAGE
]
const EnergySink = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_STORAGE,
  STRUCTURE_TOWER,
  STRUCTURE_CONTAINER
]
