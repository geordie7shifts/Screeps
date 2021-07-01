export enum JobType {
  Mining,
  Hauling,
  Building,
  Upgrading
}

export interface Job {
  id: string
  roomName: string
  type: JobType
  status: string
  description: string
  source?: Source | AnyOwnedStructure | ConstructionSite
  target?: AnyStructure
  targets?: AnyStructure[]
  controller?: StructureController
  site?: ConstructionSite
  dest?: RoomPosition
  spawn?: StructureSpawn
  path?: any
}
