import { Job } from "types/Job"
import { HeatMap } from "utils/heatMap"

export interface _CreepMemory {
  role: CreepRole
  job?: Job
  room?: string
  working?: boolean
}

export interface _RoomMemory {
  [index: string]: any
  heatMap?: HeatMap[]
  jobs?: JobList
  buildOrders?: string[]
  roadPlanner?: RoomPosition[]
  sources?: MiningSpot[]
}

export enum CreepRole {
  All,
  Miner,
  Hauler,
  Fighter,
  Upgrader,
  Builder
}

export interface JobList {
  [index: string]: any
  totalMiningJobs: number
  mining?: Job[]
  upgrading?: Job[]
  building?: Job[]
}

export interface MiningSpot {
  sourceId: string
  pos: RoomPosition
  spots: RoomPosition[]
  hasDedicatedMiner: boolean
  hasContainer: boolean
  containerId: string
}
