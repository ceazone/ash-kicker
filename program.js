/* Ash Kicker — the program: exercises and workouts.
   type: 'w' weight × reps · 'bw' reps only · 't' timed (seconds)
   pair: two dumbbells (weight logged is per hand) · side: done each side
   inc: suggested weight jump in lb · swaps: same-job alternatives */
(function (root) {
  const EX = {
    warm: {
      name: 'Warm-up', muscle: 'Whole body', equip: 'Any cardio machine', type: 't', secs: 300, noFeel: true,
      how: 'Five easy minutes on the bike, elliptical, rower or incline treadmill. You should be able to chat the whole time. Then take five slow breaths: breathe in and let your belly and pelvic floor relax, breathe out and gently lift the pelvic floor.',
      q: 'gym warm up before lifting beginner low impact'
    },
    cardio: {
      name: 'Low-impact cardio', muscle: 'Heart & lungs', equip: 'Bike, elliptical, rower or incline walk', type: 't', secs: 1200, noFeel: true,
      how: 'Twenty steady minutes. Breathing noticeably but still able to speak in full sentences. No running or jumping for now: impact is the hardest thing on a pelvic floor that is still rebuilding.',
      q: 'low impact cardio gym workout postpartum'
    },

    /* ---- legs ---- */
    legpress: {
      name: 'Leg Press', muscle: 'Quads & glutes', equip: 'Machine', type: 'w', lo: 10, hi: 12, inc: 10, swaps: ['goblet'],
      how: 'Feet shoulder-width, mid-platform. Lower until your knees are around 90°, keeping your lower back and hips glued to the pad, then press back up without locking the knees.',
      cue: 'Breathe out as you push. Never hold your breath and bear down.',
      q: 'leg press machine proper form'
    },
    goblet: {
      name: 'Goblet Squat', muscle: 'Quads & glutes', equip: 'One dumbbell', type: 'w', lo: 8, hi: 12, inc: 5, swaps: ['legpress'],
      how: 'Hold one dumbbell upright against your chest. Feet a little wider than your hips. Sit down between your heels as low as stays comfortable, chest tall, then stand.',
      cue: 'Breathe in on the way down, out as you stand.',
      q: 'goblet squat proper form'
    },
    stepup: {
      name: 'Dumbbell Step-Up', muscle: 'Legs, one at a time', equip: 'Bench or box + dumbbells', type: 'w', lo: 8, hi: 10, inc: 5, pair: true, side: true, swaps: ['legext', 'legpress'],
      how: 'A box around knee height or lower. Put one whole foot on it, stand up tall by pushing through that foot, then lower slowly. Do all reps on one leg, then the other. Start with no weight to find your balance.',
      cue: 'Breathe out as you step up.',
      q: 'dumbbell step up proper form'
    },
    legext: {
      name: 'Leg Extension', muscle: 'Quads', equip: 'Machine', type: 'w', lo: 10, hi: 15, inc: 5, swaps: ['stepup'],
      how: 'Set the pad just above your ankles and the pivot in line with your knee. Straighten your legs, squeeze for a second at the top, lower slowly.',
      q: 'leg extension machine proper form'
    },
    rdl: {
      name: 'Dumbbell Romanian Deadlift', muscle: 'Hamstrings & glutes', equip: 'Dumbbells', type: 'w', lo: 10, hi: 12, inc: 5, pair: true, swaps: ['legcurl', 'backext'],
      how: 'Dumbbells in front of your thighs, knees soft. Push your hips straight back and let the weights slide down your legs until you feel a stretch in the hamstrings, then drive your hips forward to stand.',
      cue: 'Start light. You should feel hamstrings and glutes working. If your lower back is doing the work, shorten the range and push the hips further back.',
      q: 'dumbbell romanian deadlift proper form'
    },
    legcurl: {
      name: 'Seated Leg Curl', muscle: 'Hamstrings', equip: 'Machine', type: 'w', lo: 10, hi: 15, inc: 5, swaps: ['rdl'],
      how: 'Pad just above your heels, thigh pad snug. Curl your heels under the seat, pause, and let them back up slowly.',
      q: 'seated leg curl machine proper form'
    },
    hipthrust: {
      name: 'Hip Thrust', muscle: 'Glutes', equip: 'Machine, or bench + dumbbell', type: 'w', lo: 10, hi: 12, inc: 10, swaps: ['dbbridge'],
      how: 'Upper back on the bench or pad, feet flat, weight across your hips. Drive your hips up until your body is a straight line from shoulders to knees. Squeeze, then lower.',
      cue: 'Breathe out on the way up. Ribs down: finish with your glutes, not by arching your back.',
      q: 'hip thrust proper form machine or dumbbell'
    },
    dbbridge: {
      name: 'Dumbbell Glute Bridge', muscle: 'Glutes', equip: 'Mat + one dumbbell', type: 'w', lo: 12, hi: 15, inc: 5, swaps: ['hipthrust'],
      how: 'On your back, knees bent, a dumbbell resting on your hips. Push through your heels and lift your hips into a straight line. Squeeze, then lower slowly.',
      cue: 'Breathe out as you lift.',
      q: 'dumbbell glute bridge proper form'
    },
    abduct: {
      name: 'Hip Abduction', muscle: 'Outer hips', equip: 'Machine', type: 'w', lo: 12, hi: 15, inc: 5, swaps: ['dbbridge'],
      how: 'Sit tall with the pads outside your knees. Press your knees apart, pause, and bring them back together slowly. Strong outer hips steady the pelvis and take load off the lower back.',
      q: 'hip abduction machine proper form'
    },
    backext: {
      name: '45° Back Extension', muscle: 'Lower back & glutes', equip: 'Back extension bench', type: 'bw', lo: 10, hi: 12, swaps: ['rdl', 'birddog'],
      how: 'Pad just below your hip bones. Arms crossed, hinge down with a long spine, then lift until your body is one straight line. Stop there. Do not swing up past straight.',
      cue: 'Slow and smooth. This is the one that rebuilds your lower back. When 12 feel easy, hug a light plate.',
      q: '45 degree back extension proper form glutes'
    },

    /* ---- push ---- */
    dbbench: {
      name: 'Dumbbell Bench Press', muscle: 'Chest & triceps', equip: 'Flat bench + dumbbells', type: 'w', lo: 8, hi: 12, inc: 5, pair: true, swaps: ['chestpress'],
      how: 'On your back, feet flat on the floor. Dumbbells start above your chest. Lower them to the sides of your chest with elbows about 45° from your body, then press back up.',
      cue: 'Breathe out as you press.',
      q: 'dumbbell bench press proper form'
    },
    incline: {
      name: 'Incline Dumbbell Press', muscle: 'Upper chest & shoulders', equip: 'Incline bench + dumbbells', type: 'w', lo: 8, hi: 12, inc: 5, pair: true, swaps: ['chestpress'],
      how: 'Bench at a low incline, about 30°. Lower the dumbbells to the top of your chest, then press up and slightly together.',
      cue: 'Breathe out as you press.',
      q: 'incline dumbbell press proper form'
    },
    chestpress: {
      name: 'Machine Chest Press', muscle: 'Chest & triceps', equip: 'Machine', type: 'w', lo: 10, hi: 12, inc: 5, swaps: ['dbbench'],
      how: 'Seat height so the handles line up with the middle of your chest. Press until your arms are long, then return slowly without letting the weight stack touch down.',
      cue: 'Breathe out as you press.',
      q: 'machine chest press proper form'
    },
    ohp: {
      name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', equip: 'Upright bench + dumbbells', type: 'w', lo: 8, hi: 12, inc: 5, pair: true, swaps: ['shoulderm'],
      how: 'Back supported, dumbbells at shoulder height. Press overhead until your arms are straight, then lower under control.',
      cue: 'Breathe out as you press. Keep your ribs down and your lower back on the pad.',
      q: 'seated dumbbell shoulder press proper form'
    },
    shoulderm: {
      name: 'Machine Shoulder Press', muscle: 'Shoulders', equip: 'Machine', type: 'w', lo: 10, hi: 12, inc: 5, swaps: ['ohp'],
      how: 'Handles level with your shoulders. Press up until your arms are long, lower slowly.',
      cue: 'Breathe out as you press.',
      q: 'machine shoulder press proper form'
    },
    lateral: {
      name: 'Dumbbell Lateral Raise', muscle: 'Side shoulders', equip: 'Light dumbbells', type: 'w', lo: 12, hi: 15, inc: 2.5, pair: true, swaps: ['shoulderm'],
      how: 'Slight bend in the elbows. Raise your arms out to the sides to shoulder height, no higher, then lower slowly. Lighter than you think: these are humbling.',
      q: 'dumbbell lateral raise proper form'
    },
    pushdown: {
      name: 'Triceps Rope Pushdown', muscle: 'Triceps', equip: 'Cable + rope', type: 'w', lo: 10, hi: 15, inc: 5, swaps: ['triext'],
      how: 'Elbows pinned to your sides. Push the rope down and spread it apart at the bottom, then let it rise back to chest height.',
      q: 'triceps rope pushdown proper form'
    },
    triext: {
      name: 'Lying Dumbbell Triceps Extension', muscle: 'Triceps', equip: 'Bench + dumbbells', type: 'w', lo: 10, hi: 12, inc: 2.5, pair: true, swaps: ['pushdown'],
      how: 'On your back, arms straight up. Bend only at the elbows to lower the dumbbells beside your ears, then straighten.',
      q: 'lying dumbbell triceps extension proper form'
    },

    /* ---- pull ---- */
    row: {
      name: 'Seated Cable Row', muscle: 'Mid back', equip: 'Cable machine', type: 'w', lo: 10, hi: 12, inc: 5, swaps: ['dbrow'],
      how: 'Sit tall, knees soft. Pull the handle to your lower ribs, squeeze your shoulder blades together, then reach forward slowly without rounding your lower back.',
      cue: 'Breathe out as you pull.',
      q: 'seated cable row proper form'
    },
    dbrow: {
      name: 'One-Arm Dumbbell Row', muscle: 'Back', equip: 'Bench + one dumbbell', type: 'w', lo: 10, hi: 12, inc: 5, side: true, swaps: ['row'],
      how: 'One hand and knee on a bench, back flat. Pull the dumbbell toward your hip, leading with the elbow, then lower slowly. All reps one side, then switch.',
      cue: 'Breathe out as you pull.',
      q: 'one arm dumbbell row proper form'
    },
    pulldown: {
      name: 'Lat Pulldown', muscle: 'Lats', equip: 'Cable machine', type: 'w', lo: 10, hi: 12, inc: 5, swaps: ['row'],
      how: 'Grip a little wider than your shoulders, thighs under the pads. Pull the bar to your collarbone by driving your elbows down, then let it rise slowly.',
      cue: 'Breathe out as you pull. Do not lean way back.',
      q: 'lat pulldown proper form'
    },
    facepull: {
      name: 'Cable Face Pull', muscle: 'Rear shoulders & upper back', equip: 'Cable + rope, set at face height', type: 'w', lo: 12, hi: 15, inc: 5, swaps: ['revfly'],
      how: 'Pull the rope toward your eyes, elbows high and wide, hands finishing beside your ears. Slow on the way back. This one undoes hours of feeding-and-carrying posture.',
      q: 'cable face pull proper form'
    },
    revfly: {
      name: 'Reverse Fly Machine', muscle: 'Rear shoulders & upper back', equip: 'Machine', type: 'w', lo: 12, hi: 15, inc: 5, swaps: ['facepull'],
      how: 'Chest against the pad, arms long. Open your arms out wide until they are level with your shoulders, then return slowly.',
      q: 'reverse fly machine rear delt proper form'
    },
    curl: {
      name: 'Dumbbell Curl', muscle: 'Biceps', equip: 'Dumbbells', type: 'w', lo: 10, hi: 12, inc: 2.5, pair: true, swaps: ['hammer'],
      how: 'Elbows tucked at your sides, palms up. Curl without swinging, lower slowly.',
      q: 'dumbbell bicep curl proper form'
    },
    hammer: {
      name: 'Hammer Curl', muscle: 'Biceps & forearms', equip: 'Dumbbells', type: 'w', lo: 10, hi: 12, inc: 2.5, pair: true, swaps: ['curl'],
      how: 'Like a curl, but with palms facing each other the whole way.',
      q: 'dumbbell hammer curl proper form'
    },

    /* ---- core & back finishers ---- */
    deadbug: {
      name: 'Dead Bug', muscle: 'Deep core', equip: 'Mat', type: 'bw', lo: 8, hi: 10, side: true, swaps: ['birddog'],
      how: 'On your back, knees over hips, arms to the ceiling. Press your lower back gently into the floor. Slowly lower one leg and the opposite arm, return, switch sides.',
      cue: 'Breathe out as the leg lowers. If your belly domes or your back lifts, shorten the reach.',
      q: 'dead bug exercise proper form'
    },
    birddog: {
      name: 'Bird Dog', muscle: 'Lower back & balance', equip: 'Mat', type: 'bw', lo: 8, hi: 10, side: true, swaps: ['deadbug'],
      how: 'On hands and knees. Reach one arm forward and the opposite leg back until both are level. Hold two seconds with your hips still, return, switch.',
      cue: 'Imagine a glass of water on your lower back.',
      q: 'bird dog exercise proper form'
    },
    sideplank: {
      name: 'Side Plank', muscle: 'Side core', equip: 'Mat', type: 't', secs: 20, max: 45, side: true, swaps: ['pallof'],
      how: 'On your side, elbow under shoulder. Start with knees bent and lift your hips into a straight line. Keep breathing the whole time. Straighten your legs once 30 seconds on the knees feels easy.',
      cue: 'Keep breathing. Holding your breath loads the pelvic floor.',
      q: 'side plank from knees proper form beginner'
    },
    pallof: {
      name: 'Pallof Press', muscle: 'Core, anti-twist', equip: 'Cable at chest height', type: 'w', lo: 10, hi: 12, inc: 5, side: true, swaps: ['sideplank'],
      how: 'Stand side-on to the cable, handle held at your chest. Press it straight out in front, hold for two seconds without letting it twist you, bring it back. Go light.',
      cue: 'Breathe out as you press.',
      q: 'pallof press proper form cable'
    },
    carry: {
      name: 'Suitcase Carry', muscle: 'Core & grip', equip: 'One dumbbell', type: 't', secs: 30, max: 45, side: true, swaps: ['sideplank'],
      how: 'Hold one dumbbell at your side like a suitcase and walk slowly, standing tall. Do not lean toward or away from the weight. Swap hands. A weight you could curl is too light; start around 20 lb.',
      cue: 'Normal breathing. Shoulders level.',
      q: 'suitcase carry exercise proper form'
    },
    bridge: {
      name: 'Glute Bridge', muscle: 'Glutes & pelvic floor', equip: 'Mat', type: 'bw', lo: 12, hi: 15, swaps: ['birddog'],
      how: 'On your back, knees bent, feet flat. Push through your heels and lift your hips into a straight line, squeeze for two seconds, lower slowly.',
      cue: 'Breathe out and gently lift the pelvic floor as your hips rise. Relax it fully at the bottom.',
      q: 'glute bridge proper form'
    }
  };

  /* slot = [exerciseId, fixedSets?]  — main lifts take the phase set count */
  const WORKOUTS = {
    FA: { name: 'Full Body A', tag: 'Press, row, hinge', slots: [['warm', 1], ['legpress'], ['dbbench'], ['row'], ['rdl'], ['ohp'], ['deadbug', 2], ['birddog', 2]] },
    FB: { name: 'Full Body B', tag: 'Squat, pull, glutes', slots: [['warm', 1], ['goblet'], ['pulldown'], ['hipthrust'], ['incline'], ['legcurl'], ['sideplank', 2], ['pallof', 2]] },
    FC: { name: 'Full Body C', tag: 'Single-leg, back, arms', slots: [['warm', 1], ['stepup'], ['chestpress'], ['dbrow'], ['backext'], ['curl'], ['carry', 2], ['deadbug', 2]] },
    UA: { name: 'Upper Body A', tag: 'Press and pull', slots: [['warm', 1], ['dbbench'], ['pulldown'], ['ohp'], ['row'], ['pushdown'], ['deadbug', 2], ['pallof', 2]] },
    LA: { name: 'Lower Body A', tag: 'Legs and glutes', slots: [['warm', 1], ['legpress'], ['rdl'], ['hipthrust'], ['legcurl'], ['abduct'], ['birddog', 2], ['sideplank', 2]] },
    UB: { name: 'Upper Body B', tag: 'Shoulders, back, arms', slots: [['warm', 1], ['incline'], ['dbrow'], ['lateral'], ['facepull'], ['curl'], ['carry', 2], ['deadbug', 2]] },
    LB: { name: 'Lower Body B', tag: 'Squat, back, hips', slots: [['warm', 1], ['goblet'], ['backext'], ['stepup'], ['legext'], ['abduct'], ['bridge', 2], ['sideplank', 2]] },
    CC: { name: 'Cardio & Core', tag: 'The lighter day', slots: [['cardio', 1], ['deadbug', 2], ['birddog', 2], ['sideplank', 2], ['pallof', 2], ['bridge', 2]] }
  };

  const ROTATIONS = {
    full2: ['FA', 'FB'],
    full3: ['FA', 'FB', 'FC'],
    ul4: ['UA', 'LA', 'UB', 'LB'],
    ul5: ['UA', 'LA', 'UB', 'LB', 'CC']
  };
  const SPLIT_NAMES = { full2: 'Full body', full3: 'Full body × 3', ul4: 'Upper / lower', ul5: 'Upper / lower + cardio & core' };

  const P = { EX, WORKOUTS, ROTATIONS, SPLIT_NAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  root.AK_PROGRAM = P;
})(typeof window !== 'undefined' ? window : globalThis);
