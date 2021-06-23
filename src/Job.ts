
export enum JobType {
    Mine,
    Haul,
    Build,
    Upgrade
}

export class Job {
    roomName:string;
    pos:RoomPosition;
    type:JobType;

    constructor(roomName:string, pos:RoomPosition, type:JobType){
        this.roomName = roomName;
        this.pos = pos;
        this.type = type;
    }
}
