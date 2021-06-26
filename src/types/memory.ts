import { Job } from "types/Job"
import { HeatMap } from "utils/heatMap"

export interface _Memory {
  jobs: Job[]
}

export interface _CreepMemory {
  role: CreepRole
  job?: Job
  room?: string
  working?: boolean
}

export interface _RoomMemory {
  heatMap: HeatMap[] | undefined
  jobs?: JobList
  buildOrders: string[] | undefined
  roadPlanner: RoomPosition[] | undefined
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
  mining: Job[] | undefined
  upgrading: Job[] | undefined
  building: Job[] | undefined
}
