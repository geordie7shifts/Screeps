export function processTowers(room: Room) {
  let towers = Game.rooms[room.name].find(FIND_STRUCTURES, {
    filter: { structureType: STRUCTURE_TOWER }
  }) as StructureTower[]

  _.forEach(towers, t => doTowerThings(t))
}

export function doTowerThings(tower: StructureTower) {
  let targets = tower.room
    .find(FIND_HOSTILE_CREEPS)
    .sort((a, b) => tower.pos.getRangeTo(a) - tower.pos.getRangeTo(b))

  if (targets.length > 0) {
    console.log("ENEMY CREEPS SPOTTED!")
    if (tower.store.energy > 0) tower.attack(targets[0])
  }

  let creeps = tower.room.find(FIND_MY_CREEPS)

  _.forEach(creeps, c => {
    if (c.hits < c.hitsMax) tower.heal(c)
  })

  let repairs = tower.room
    .find(FIND_STRUCTURES)
    .sort((a, b) => tower.pos.getRangeTo(a) - tower.pos.getRangeTo(b))

  let done = false
  for (let i = 0; i < repairs.length && !done; i++) {
    let target = Game.getObjectById(repairs[i].id) as Structure

    if (
      target.structureType !== STRUCTURE_WALL &&
      target.hitsMax - target.hits > 800 &&
      tower.store.energy > 200
    ) {
      let t = tower.repair(target)
      console.log(
        `trying to repair ${target.structureType} at ${target.pos.x}, ${target.pos.y} (${t})`
      )
      done = true
    }
  }
}
