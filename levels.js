
 // LEVELS_DATA - Level 2 single box adjustment
const LEVELS_DATA = {
  1: {
    name: "Level 1 - The Forest",
    END: 4200,
    segs: [[-300,700],[772,2050],[2122,2850],[2920,3350],[3420,4200]],
    gaps: [[700,772],[2050,2122],[2850,2920],[3350,3420]],
    spikes: [[900,944],[2650,2686],[3560,3600]],
    walls: [{x:1380,y:-70,w:40,h:70},{x:3050,y:-36,w:24,h:36}],
    crates: [{x:1200}],
    boulder: {at: 2480, pit: [3350,3420], once: true},
    stal: {x:1800},
    checkpoints: [80,1050,2330,2960],
    exit: 3850
  },
  2: {
    name: "Level 2 - The Lake",
    END: 7800,
    segs: [[4100,4400],[4700,5550],[5660,6300],[6410,7800]],
    gaps: [[4400,4700],[5550,5660],[6300,6410]],
    spikes: [[5750,5790],[6550,6590]],
    walls: [{x:5100,y:-50,w:40,h:50}],
    crates: [{x:5480}],
    lake: {x:4400, x2:4700},
    log: {x:4450, w:160, speed:0.7},
    checkpoints: [4150,5000,6450],
    exit: 7350
  }
};
