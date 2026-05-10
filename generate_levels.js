// 生成40个关卡 JSON 文件
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'levels');

// ─── 地图模板（10种布局，循环使用） ───
const MAP_TEMPLATES = [
  // T1: 小森林
  {w:12,h:9,tiles:[
    "WWWWWWWWWWWW","W..........W","W....W.....W","W.....W....W",
    "W..........W","W..........W","W..W.......W","W.........EW","WWWWWWWWWWWW"
  ]},
  // T2: 回廊
  {w:10,h:9,tiles:[
    "WWWWWWWWWW","W........W","W.WWW.WW.W","W.W....W.W",
    "W...WW...W","WW.W..W.WW","W..W..W..W","W.......EW","WWWWWWWWWW"
  ]},
  // T3: Z形
  {w:11,h:10,tiles:[
    "WWWWWWWWWWW","W..........W","W..WWWWWWWW","W..........W",
    "WWWWWWWW..W","W..........W","W..WWWWWWWW","W..........W",
    "W.........EW","WWWWWWWWWWW"
  ]},
  // T4: 十字
  {w:11,h:11,tiles:[
    "WWWWWWWWWWW","W....WE...W","W.WWW...WWW","W.....W...W",
    "WWWW.W.WW.W","W......W..W","W.WWW.WW..W","W.......W.W",
    "W.WWW.....W","W.........W","WWWWWWWWWWW"
  ]},
  // T5: 蛇形
  {w:10,h:12,tiles:[
    "WWWWWWWWWW","W........W","W.WWWWWW.W","W........W",
    "W.WWWWWW.W","W........W","W.WWWWWW.W","W........W",
    "W.WWWWWW.W","W........W","W.......EW","WWWWWWWWWW"
  ]},
  // T6: 迷宫
  {w:13,h:9,tiles:[
    "WWWWWWWWWWWWW","W........W..W","W.WW.WWW.W..W","W...........W",
    "W.WWWWW.WWW.W","W...........W","W.WW.WWW.WW.W","W..........EW","WWWWWWWWWWWWW"
  ]},
  // T7: 螺旋
  {w:12,h:12,tiles:[
    "WWWWWWWWWWWW","W..........W","W.WWWWWWWW.W","W.W........W",
    "W.W.WWWW.W.W","W.W.W..W.W.W","W.W.WW.W.W.W","W.W......W.W",
    "W.WWWWWWWW.W","W..........W","W.........EW","WWWWWWWWWWWW"
  ]},
  // T8: 峡谷
  {w:8,h:14,tiles:[
    "WWWWWWWW","W......W","W.WW.W.W","W......W","W.WW.W.W",
    "W......W","W.WWWW.W","W......W","W......W","W.WWWW.W",
    "W......W","W......W","W.....EW","WWWWWWWW"
  ]},
  // T9: 塔形
  {w:13,h:11,tiles:[
    "WWWWWWWWWWWWW","W.....W.....W","W..WWW.WWW..W","W...........W",
    "W..WWWWWWW..W","W...........W","W..WWWWWWW..W","W...........W",
    "W..WWW.WWW..W","W..........EW","WWWWWWWWWWWWW"
  ]},
  // T10: 开阔平原
  {w:15,h:10,tiles:[
    "WWWWWWWWWWWWWWW","W..............W","W..WW..WW..WW.W","W..............W",
    "W..WW..WW..WW.W","W..............W","W..WW..WW..WW.W","W..............W",
    "W.............EW","WWWWWWWWWWWWWWW"
  ]}
];

// ─── 题目池（从15次复习题中提取，分级） ───
const Q_POOLS = {
  // Grade 1上册：be动词、颜色、数字、五官
  g1a: [
    {type:"choice",q:"I ___ a student.",opts:["am","is","are","be"],ans:0,tt:8},
    {type:"choice",q:"What colour is it? — It's ___.",opts:["red","a cat","three","fine"],ans:0,tt:7},
    {type:"choice",q:"How many cats? — ___.",opts:["Fine","Red","Three","Yes"],ans:2,tt:7},
    {type:"choice",q:"Is it a dog? — ___, it isn't.",opts:["Yes","No","OK","Fine"],ans:1,tt:7},
    {type:"choice",q:"What's this? — It's ___ apple.",opts:["a","an","the","/"],ans:1,tt:8},
    {type:"fill",q:"I see with my ___（眼睛）.",ans:"eye",alts:["eyes","Eye"],tt:9},
    {type:"fill",q:"I hear with my ___（耳朵）.",ans:"ear",alts:["ears","Ear"],tt:9},
    {type:"fill",q:"I smell with my ___（鼻子）.",ans:"nose",alts:["Nose"],tt:9},
    {type:"fill",q:"I eat with my ___（嘴巴）.",ans:"mouth",alts:["Mouth"],tt:9},
    {type:"fill",q:"Arrange: this / What / is / ?",ans:"What is this",alts:["what is this"],tt:12},
    {type:"fill",q:"Arrange: It's / blue / .",ans:"It's blue",alts:["it is blue","it's blue"],tt:12}
  ],
  // Grade 1下册：家庭、a/an、am/is/are、问候
  g1b: [
    {type:"fill",q:"Your father's father → ___（爷爷）",ans:"grandpa",alts:["grandfather","granddad"],tt:9},
    {type:"fill",q:"Your mother's sister → ___（姨妈）",ans:"aunt",tt:9},
    {type:"fill",q:"Your father's brother → ___（叔叔）",ans:"uncle",tt:9},
    {type:"choice",q:"___ book",opts:["A","An","The","/"],ans:0,tt:7},
    {type:"choice",q:"___ apple",opts:["A","An","The","/"],ans:1,tt:7},
    {type:"choice",q:"___ egg",opts:["A","An","The","/"],ans:1,tt:7},
    {type:"fill",q:"I ___ a boy.（用am/is/are）",ans:"am",tt:7},
    {type:"fill",q:"She ___ my mother.",ans:"is",tt:7},
    {type:"fill",q:"You ___ my friend.",ans:"are",tt:7},
    {type:"fill",q:"They ___ teachers.",ans:"are",tt:7},
    {type:"choice",q:"A: ___ your name? B: My name is Lucy.",opts:["What","What's","How","How's"],ans:1,tt:7},
    {type:"choice",q:"Nice to meet ___!",opts:["you","your","yours","me"],ans:0,tt:6}
  ],
  // Grade 2上册：日常活动、季节、天气、交通、Do问句
  g2a: [
    {type:"choice",q:"I ___ up at 7 o'clock.",opts:["get","gets","getting","got"],ans:0,tt:7},
    {type:"choice",q:"We ___ to school by bus.",opts:["go","goes","going","went"],ans:0,tt:7},
    {type:"choice",q:"They ___ summer.",opts:["like","likes","liked","liking"],ans:0,tt:7},
    {type:"choice",q:"Which is a season?",opts:["Monday","spring","bus","sunny"],ans:1,tt:7},
    {type:"choice",q:"Which is weather?",opts:["summer","bike","rainy","winter"],ans:2,tt:7},
    {type:"choice",q:"Which is transport?",opts:["spring","cloudy","train","go to bed"],ans:2,tt:7},
    {type:"fill",q:"___ you like summer?（Do/Does）",ans:"Do",tt:7},
    {type:"fill",q:"I like winter. → I ___ like winter.",ans:"don't",alts:["do not"],tt:9},
    {type:"fill",q:"We ___ go to school on Sunday.",ans:"don't",alts:["do not"],tt:8},
    {type:"fill",q:"___ time is it?",ans:"What",alts:["what"],tt:7},
    {type:"choice",q:"It's six ___.",opts:["o'clock","clock","time","hour"],ans:0,tt:6}
  ],
  // Grade 2下册：can/can't、现在进行时、星期
  g2b: [
    {type:"choice",q:"A fish ___ swim.",opts:["can","can't","is","are"],ans:0,tt:6},
    {type:"choice",q:"A bird ___ fly.",opts:["can't","is","can","are"],ans:2,tt:6},
    {type:"choice",q:"A cat ___ fly.",opts:["can","can't","is","are"],ans:1,tt:6},
    {type:"fill",q:"I ___ (read) a book now.",ans:"am reading",tt:9},
    {type:"fill",q:"He ___ (play) football now.",ans:"is playing",tt:9},
    {type:"fill",q:"She ___ (dance) now.",ans:"is dancing",tt:9},
    {type:"fill",q:"They ___ (swim) now.",ans:"are swimming",tt:9},
    {type:"fill",q:"We ___ (sing) a song now.",ans:"are singing",tt:9},
    {type:"fill",q:"Monday → 星期一. Saturday → ___",ans:"星期六",alts:["Saturday"],tt:7},
    {type:"choice",q:"What day is it? — It's ___.",opts:["7 o'clock","Monday","hot","sunny"],ans:1,tt:7},
    {type:"choice",q:"___ do you get up? — At 6.",opts:["What","Where","What time","How"],ans:2,tt:7}
  ],
  // Grade 3上册：科目、三单、否定句、职业
  g3a: [
    {type:"fill",q:"语文 → ___",ans:"Chinese",alts:["chinese"],tt:7},
    {type:"fill",q:"数学 → ___",ans:"maths",alts:["math","Maths"],tt:7},
    {type:"fill",q:"英语 → ___",ans:"English",alts:["english"],tt:7},
    {type:"fill",q:"科学 → ___",ans:"science",tt:7},
    {type:"choice",q:"He ___ cats.",opts:["like","likes","liked","liking"],ans:1,tt:7},
    {type:"choice",q:"She ___ to school by bus.",opts:["go","goes","going","went"],ans:1,tt:7},
    {type:"choice",q:"The cat ___ fish.",opts:["eat","eats","eating","ate"],ans:1,tt:7},
    {type:"fill",q:"He likes apples. → He ___ like apples.",ans:"doesn't",alts:["does not"],tt:9},
    {type:"fill",q:"___ he like dogs?（Does/Do）",ans:"Does",tt:7},
    {type:"choice",q:"Which is NOT a subject?",opts:["Chinese","English","science","doctor"],ans:3,tt:7}
  ],
  // Grade 3下册：食物、复数、there be、方位介词
  g3b: [
    {type:"fill",q:"hamburger → 中文：___",ans:"汉堡包",alts:["汉堡","汉堡包"],tt:7},
    {type:"fill",q:"noodles → 中文：___",ans:"面条",tt:7},
    {type:"fill",q:"cat → 复数：___",ans:"cats",tt:6},
    {type:"fill",q:"bus → 复数：___",ans:"buses",tt:7},
    {type:"fill",q:"baby → 复数：___",ans:"babies",tt:7},
    {type:"fill",q:"man → 复数：___",ans:"men",tt:7},
    {type:"fill",q:"child → 复数：___",ans:"children",tt:7},
    {type:"choice",q:"___ a book on the desk.",opts:["There is","There are","There was","There were"],ans:0,tt:7},
    {type:"choice",q:"___ two pens in the case.",opts:["There is","There are","There was","There were"],ans:1,tt:7},
    {type:"choice",q:"The book is ___ the desk（在……上）.",opts:["in","on","under","behind"],ans:1,tt:7},
    {type:"choice",q:"The cat is ___ the chair（在……下）.",opts:["in","on","under","behind"],ans:2,tt:7}
  ],
  // Grade 4上册：社区场所、动词过去式
  g4a: [
    {type:"fill",q:"Buy books here → ___",ans:"bookstore",alts:["book shop","bookshop"],tt:9},
    {type:"fill",q:"See a film here → ___",ans:"cinema",alts:["movie theater"],tt:9},
    {type:"fill",q:"Buy food here → ___",ans:"supermarket",tt:9},
    {type:"fill",q:"Send letters here → ___",ans:"post office",tt:9},
    {type:"fill",q:"play → 过去式：___",ans:"played",tt:7},
    {type:"fill",q:"like → 过去式：___",ans:"liked",tt:7},
    {type:"fill",q:"study → 过去式：___",ans:"studied",tt:7},
    {type:"fill",q:"go → 过去式：___",ans:"went",tt:7},
    {type:"fill",q:"eat → 过去式：___",ans:"ate",tt:7},
    {type:"fill",q:"see → 过去式：___",ans:"saw",tt:7},
    {type:"fill",q:"take → 过去式：___",ans:"took",tt:7},
    {type:"choice",q:"I ___ TV yesterday.",opts:["watch","watched","watching","watches"],ans:1,tt:7},
    {type:"choice",q:"She didn't ___ basketball.",opts:["play","played","playing","plays"],ans:0,tt:9}
  ],
  // Grade 4下册：be going to、比较级
  g4b: [
    {type:"choice",q:"I ___ going to visit my grandpa.",opts:["am","is","are","be"],ans:0,tt:7},
    {type:"choice",q:"She ___ going to learn swimming.",opts:["am","is","are","be"],ans:1,tt:7},
    {type:"choice",q:"They ___ going to go on a trip.",opts:["am","is","are","be"],ans:2,tt:7},
    {type:"choice",q:"Tom is ___ than Mike.",opts:["tall","taller","tallest","more tall"],ans:1,tt:7},
    {type:"choice",q:"This book is ___ than that one.",opts:["interesting","more interesting","most interesting","interestinger"],ans:1,tt:9},
    {type:"choice",q:"My bag is ___ (big) than yours.",opts:["big","bigger","biggest","more big"],ans:1,tt:7},
    {type:"fill",q:"She is ___ (happy) than before.",ans:"happier",tt:8},
    {type:"fill",q:"This pen is ___ (cheap) than that one.",ans:"cheaper",tt:8},
    {type:"choice",q:"What ___ you doing?",opts:["am","is","are","be"],ans:2,tt:6}
  ],
  // Grade 5上册：国家、现在完成时、频率副词
  g5a: [
    {type:"fill",q:"China's capital is ___.",ans:"Beijing",alts:["beijing"],tt:7},
    {type:"choice",q:"The capital of UK is ___.",opts:["Beijing","London","Tokyo","Paris"],ans:1,tt:7},
    {type:"choice",q:"The capital of USA is ___.",opts:["London","Tokyo","Washington D.C.","Canberra"],ans:2,tt:8},
    {type:"fill",q:"I ___ (have/has) been to Beijing.",ans:"have",tt:7},
    {type:"fill",q:"She ___ (have/has) eaten sushi.",ans:"has",tt:7},
    {type:"fill",q:"They ___ (have/has) seen that film.",ans:"have",tt:7},
    {type:"choice",q:"Have you ___ seen a panda?",opts:["ever","never","always","usually"],ans:0,tt:7},
    {type:"choice",q:"I have ___ eaten snake soup.（从未）",opts:["ever","never","always","usually"],ans:1,tt:7},
    {type:"choice",q:"always → ___ → often → sometimes → never",opts:["usually","seldom","ever","hardly"],ans:0,tt:9},
    {type:"choice",q:"He ___ gone to the supermarket（去了未回）.",opts:["has been to","has gone to","have been to","have gone to"],ans:1,tt:10}
  ],
  // Grade 5下册：should/must、物主代词、句型转换
  g5b: [
    {type:"choice",q:"You ___ drink more water.（应该）",opts:["should","shouldn't","must","mustn't"],ans:0,tt:7},
    {type:"choice",q:"You ___ eat too much candy.（不应该）",opts:["should","shouldn't","must","mustn't"],ans:1,tt:7},
    {type:"choice",q:"You ___ run in the classroom.（禁止）",opts:["should","shouldn't","must","mustn't"],ans:3,tt:7},
    {type:"choice",q:"This is ___ (my/mine) book.",opts:["my","mine","me","I"],ans:0,tt:6},
    {type:"choice",q:"This book is ___ (my/mine).",opts:["my","mine","me","I"],ans:1,tt:6},
    {type:"choice",q:"She likes reading. → ___ she like reading?",opts:["Do","Does","Did","Is"],ans:1,tt:9},
    {type:"choice",q:"They went to the park. → They ___ go.",opts:["didn't","don't","doesn't","wasn't"],ans:0,tt:9},
    {type:"choice",q:"He can swim. → ___ he swim?",opts:["Can","Does","Did","Is"],ans:0,tt:8},
    {type:"fill",q:"I ___ (always/never) brush my teeth every single day!",ans:"always",tt:7},
    {type:"fill",q:"I exercise ___ a week.（每周一次）",ans:"once",tt:7},
    {type:"fill",q:"___ book is this?（Whose/Who/What）",ans:"Whose",alts:["whose"],tt:7}
  ],
  // Grade 6上册：if条件句、被动语态、will/be going to
  g6a: [
    {type:"choice",q:"If it ___ tomorrow, we will stay home.",opts:["rain","rains","rained","will rain"],ans:1,tt:9},
    {type:"choice",q:"If you ___ hard, you will get good grades.",opts:["study","studies","studied","will study"],ans:0,tt:9},
    {type:"fill",q:"If she ___ (have) time, she will go shopping.",ans:"has",tt:8},
    {type:"choice",q:"We clean the classroom. → The classroom ___ cleaned.",opts:["is","are","was","were"],ans:0,tt:9},
    {type:"choice",q:"My mother washed the dishes. → The dishes ___ washed.",opts:["is","are","was","were"],ans:3,tt:9},
    {type:"fill",q:"The sports day ___ (hold) by students.（被动语态）",ans:"will be held",alts:["will be holded"],tt:12},
    {type:"fill",q:"Look at clouds! It ___ (rain).（有迹象）",ans:"is going to rain",tt:11},
    {type:"choice",q:"I ___ be a doctor when I grow up.",opts:["will","am going to","have","was"],ans:1,tt:8},
    {type:"choice",q:"People ___ live on Mars in future.",opts:["will","are going to","is going to","have"],ans:0,tt:8}
  ],
  // Grade 6下册：毕业词汇、时态综合、从句
  g6b: [
    {type:"fill",q:"毕业 → ___",ans:"graduation",tt:8},
    {type:"fill",q:"小学 → ___",ans:"primary school",tt:8},
    {type:"fill",q:"初中 → ___",ans:"junior high school",alts:["junior school"],tt:9},
    {type:"fill",q:"同学 → ___",ans:"classmate",tt:7},
    {type:"fill",q:"Listen! She ___ (sing) in the room.",ans:"is singing",tt:9},
    {type:"fill",q:"I ___ (go) to the park yesterday.",ans:"went",tt:7},
    {type:"fill",q:"We ___ (visit) the museum next week.",ans:"will visit",alts:["are going to visit"],tt:9},
    {type:"fill",q:"He ___ (be) to the UK twice.",ans:"has been",tt:9},
    {type:"choice",q:"I think he ___ right.",opts:["is","are","was","were"],ans:0,tt:8},
    {type:"choice",q:"I like apples ___ oranges.",opts:["and","but","so","because"],ans:0,tt:6},
    {type:"choice",q:"She is tired, ___ she goes to bed early.",opts:["and","but","so","because"],ans:2,tt:7},
    {type:"choice",q:"I stayed home ___ it rained.",opts:["and","but","so","because"],ans:3,tt:7}
  ],
  // 语法综合：时态辨析、句型转换
  grammar: [
    {type:"choice",q:"I play football every day. 是什么时态？",opts:["一般现在时","现在进行时","一般过去时","现在完成时"],ans:0,tt:7},
    {type:"choice",q:"I am playing football now. 是什么时态？",opts:["一般现在时","现在进行时","一般过去时","现在完成时"],ans:1,tt:7},
    {type:"choice",q:"I played football yesterday. 是什么时态？",opts:["一般现在时","现在进行时","一般过去时","现在完成时"],ans:2,tt:7},
    {type:"choice",q:"I have finished homework. 是什么时态？",opts:["一般现在时","现在进行时","一般过去时","现在完成时"],ans:3,tt:7},
    {type:"fill",q:"She likes apples. → ___ she like apples?（一般疑问句）",ans:"Does",tt:8},
    {type:"fill",q:"They are playing. → ___ they playing?（一般疑问句）",ans:"Are",tt:8},
    {type:"fill",q:"He went to the park. → ___ he go to the park?（一般疑问句）",ans:"Did",tt:8},
    {type:"fill",q:"My name is Tom. → ___ is your name?（提问）",ans:"What",alts:["what"],tt:7},
    {type:"fill",q:"I get up at 7. → ___ ___ do you get up?（提问）",ans:"What time",alts:["what time"],tt:8},
    {type:"fill",q:"He goes to school by bus. → ___ does he go?（提问）",ans:"How",alts:["how"],tt:8},
    {type:"choice",q:"He go to school.（改错）",opts:["He goes to school","He is go to school","He went to school","He go to school"],ans:0,tt:10},
    {type:"choice",q:"She don't like cats.（改错）",opts:["She doesn't like cats","She don't likes cats","She not like cats","She isn't like cats"],ans:0,tt:10},
    {type:"choice",q:"There is two cats.（改错）",opts:["There are two cats","There is two cat","There was two cats","There is a two cats"],ans:0,tt:10}
  ]
};

// ─── 年级→题目池映射 ───
const LEVEL_Q_MAP = [
  [], // 0-index placeholder
  {pool:['g1a'], name:'初阵森林'},
  {pool:['g1a','g1b'], name:'密林小径'},
  {pool:['g1b'], name:'古堡回廊'},
  {pool:['g2a'], name:'冰原雪道'},
  {pool:['g2a','g2b'], name:'火山洞穴'},
  {pool:['g2b'], name:'深渊遗迹'},
  {pool:['g3a'], name:'圣殿回廊'},
  {pool:['g3a','g3b'], name:'冥河渡口'},
  {pool:['g3b'], name:'云巅前哨'},
  {pool:['g4a'], name:'石林迷阵'},
  {pool:['g4a','g4b'], name:'暗影沼泽'},
  {pool:['g4b'], name:'龙骨荒原'},
  {pool:['g5a'], name:'风暴之眼'},
  {pool:['g5a','g5b'], name:'水晶洞穴'},
  {pool:['g5b'], name:'遗忘废墟'},
  {pool:['g6a'], name:'时光回廊'},
  {pool:['g6a','g6b'], name:'星穹之巅'},
  {pool:['g6b'], name:'混沌之门'},
  {pool:['grammar'], name:'语法之塔·初'},
  {pool:['grammar','g6b'], name:'语法之塔·中'},
  {pool:['grammar','g6a'], name:'语法之塔·终'},
  {pool:['g5b','g6a'], name:'决战平原'},
  {pool:['g4b','g5a'], name:'英灵殿'},
  {pool:['g3b','g4a'], name:'月影森林'},
  {pool:['g2b','g3a'], name:'晨曦山谷'},
  {pool:['g1b','g2a'], name:'翠微湖畔'},
  {pool:['g1a','g2a'], name:'清风岗'},
  {pool:['g3a','g4a'], name:'铁壁关'},
  {pool:['g5a','g6a'], name:'凌云渡'},
  {pool:['grammar','g4b'], name:'语法之塔·极'},
  {pool:['g1a','g1b','g2a'], name:'初阵·重奏'},
  {pool:['g2b','g3a','g3b'], name:'成长·回响'},
  {pool:['g4a','g4b','g5a'], name:'历练·征途'},
  {pool:['g5b','g6a','g6b'], name:'升华·蜕变'},
  {pool:['grammar','g1a'], name:'归元·壹'},
  {pool:['grammar','g2b'], name:'归元·贰'},
  {pool:['grammar','g3a'], name:'归元·叁'},
  {pool:['grammar','g5b'], name:'归元·肆'},
  {pool:['grammar','g6b'], name:'归元·伍'},
  {pool:['grammar','grammar'], name:'终焉之巅'}
];

// ─── 怪物名 & 图标 ───
const MONSTER_NAMES = [
  {n:'史莱姆',i:'🟢'},{n:'野兔',i:'🐰'},{n:'石像鬼',i:'🗿'},{n:'冰狼',i:'🐺'},
  {n:'熔岩小鬼',i:'👹'},{n:'深渊幽灵',i:'👻'},{n:'堕落骑士',i:'⚔️'},{n:'圣殿卫士',i:'🛡️'},
  {n:'骷髅兵',i:'💀'},{n:'渡魂使者',i:'⚰️'},{n:'飞龙幼崽',i:'🐉'},{n:'云巨人',i:'☁️'},
  {n:'暗黑骑士',i:'⚔️'},{n:'混沌魔龙',i:'🐲'},{n:'影狼',i:'🐺'},{n:'岩巨人',i:'🗿'},
  {n:'毒蜂群',i:'🐝'},{n:'霜巨人',i:'🧊'},{n:'火焰精灵',i:'🔥'},{n:'暗影刺客',i:'🗡️'}
];

const BOSS_NAMES = [
  {n:'树精王',i:'🌳'},{n:'巨魔首领',i:'👊'},{n:'石像鬼王',i:'💎'},{n:'冰霜巨龙',i:'🐉'},
  {n:'熔岩领主',i:'🌋'},{n:'深渊领主',i:'👾'},{n:'堕落骑士长',i:'🗡️'},{n:'圣殿大祭司',i:'✨'},
  {n:'骷髅将军',i:'💀'},{n:'冥河渡神',i:'⛵'},{n:'飞龙王',i:'🐲'},{n:'风暴巨人',i:'⚡'},
  {n:'暗黑大君',i:'👑'},{n:'混沌主宰',i:'🌀'},{n:'影之女王',i:'👸'},{n:'岩山霸王',i:'⛰️'},
  {n:'蜂后',i:'👑'},{n:'霜之哀伤',i:'❄️'},{n:'炎魔',i:'🔥'},{n:'暗影之刃',i:'🗡️'}
];

// ─── 工具：随机 ───
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function rng(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

// ─── 生成地图 ───
function generateMap(lvl) {
  const tmplIndex = (lvl - 1) % MAP_TEMPLATES.length;
  const tmpl = MAP_TEMPLATES[tmplIndex];
  // 微调：改变宽高偏置 + 添加更多墙壁
  const w = tmpl.w + ((lvl % 3 === 0) ? 2 : (lvl % 3 === 1) ? 0 : 1);
  const h = tmpl.h + ((lvl % 2 === 0) ? 1 : -1);
  const adjW = Math.max(w, 8);
  const adjH = Math.max(h, 8);

  // 重用模板并调整尺寸
  let tiles = [];
  for (let r = 0; r < adjH; r++) {
    let row = '';
    const srcRow = tmpl.tiles[r % tmpl.tiles.length];
    for (let c = 0; c < adjW; c++) {
      if (r === 0 || r === adjH - 1 || c === 0 || c === adjW - 1) {
        row += 'W';
      } else if (r === adjH - 2 && c === adjW - 2) {
        row += 'E';
      } else {
        const sc = srcRow[c % srcRow.length] || '.';
        row += sc === 'E' ? '.' : sc;
      }
    }
    tiles.push(row);
  }

  // 确保出口在正确位置
  const exitX = adjW - 2;
  const exitY = adjH - 2;
  // 把出口那格设为'.'
  tiles[exitY] = tiles[exitY].substring(0, exitX) + '.' + tiles[exitY].substring(exitX + 1);

  return {width: adjW, height: adjH, tiles, exitX, exitY};
}

// ─── 生成怪物 ───
function generateMonsters(lvl) {
  const baseHP = 20 + lvl * 4;
  const baseATK = 5 + Math.floor(lvl * 1.2);
  const xpReward = 20 + lvl * 4;

  // 2-3种怪物
  const count = 1 + Math.floor((lvl - 1) / 15);
  const monsters = [];
  for (let i = 0; i < Math.min(count, 3); i++) {
    const mi = ((lvl - 1) * 3 + i) % MONSTER_NAMES.length;
    const m = MONSTER_NAMES[mi];
    const hpMul = 0.8 + i * 0.3;
    monsters.push({
      name: m.n,
      icon: m.i,
      hp: Math.round(baseHP * hpMul),
      attack: Math.round(baseATK * (0.9 + i * 0.15)),
      aggro: 1 + Math.floor((lvl - 1) / 8),
      xpReward: Math.round(xpReward * hpMul),
      skills: [
        {name: '普通攻击', icon: '💥', dmgMul: 1.3},
        {name: '重击', icon: '💢', dmgMul: 2.0 + lvl * 0.02}
      ],
      loot: [
        {type:'gold', icon:'💰', min: Math.max(1, Math.floor(lvl*1.5)), max: Math.max(3, Math.floor(lvl*3)), chance:1.0},
        ...(lvl >= 5 ? [{type:'item', id:'hp_potion', name:'生命药水', icon:'🧪', desc:'恢复 80 点生命值', qty:1, sellPrice:10, chance:0.25}] : []),
        ...(lvl >= 10 ? [{type:'item', id:'mp_potion', name:'法力药水', icon:'💧', desc:'恢复 40 点法力值', qty:1, sellPrice:7, chance:0.2}] : []),
        {type:'material', id:`mat_lvl${lvl}`, name:`材料·${m.n}`, icon:'📦', desc:`从${m.n}身上获得的材料`, qty:1, qtyMax:2, sellPrice: Math.max(2, Math.floor(lvl/2)), chance:0.5}
      ]
    });
  }
  return monsters;
}

// ─── 生成BOSS ───
function generateBoss(lvl, monsters) {
  const bi = (lvl - 1) % BOSS_NAMES.length;
  const b = BOSS_NAMES[bi];
  const baseMonster = monsters[0];
  const hpMul = 5 + Math.floor((lvl - 1) / 8) * 2;  // 5x ~ 12x
  return {
    name: b.n,
    icon: b.i,
    hp: Math.round(baseMonster.hp * hpMul),
    maxHp: Math.round(baseMonster.hp * hpMul),
    attack: Math.round(baseMonster.attack * 1.5),
    aggro: 3,
    xpReward: Math.round(baseMonster.xpReward * 3),
    skills: [
      {name: 'BOSS·横扫', icon: '💥', dmgMul: 2.0},
      {name: 'BOSS·毁灭一击', icon: '☠️', dmgMul: 3.5 + lvl * 0.02}
    ],
    loot: [
      {type:'gold', icon:'💰', min: 10 + lvl * 3, max: 20 + lvl * 5, chance:1.0},
      {type:'item', id:'hp_big_potion', name:'大生命药水', icon:'🧪', desc:'恢复 200 点生命值', qty: 1 + Math.floor(lvl/10), sellPrice:25, chance:0.5},
      ...(lvl >= 8 ? [{type:'item', id:'mp_potion', name:'法力药水', icon:'💧', desc:'恢复 40 点法力值', qty: 2, sellPrice:7, chance:0.4}] : []),
      {type:'equipment', id:`boss_loot_lvl${lvl}`, name:`${b.n}的遗物`, icon:'👑', desc:`击败${b.n}获得的战利品`,
        slot: 'trinket1', stats: {str: Math.floor(lvl/3), int: Math.floor(lvl/3), agi: Math.floor(lvl/3), spr: Math.floor(lvl/3)},
        sellPrice: 10 + lvl * 3, chance: 0.2}
    ]
  };
}

// ─── 生成题目 ───
function generateQuestions(lvl, poolKeys) {
  const all = [];
  poolKeys.forEach(k => {
    if (Q_POOLS[k]) all.push(...Q_POOLS[k]);
  });
  if (all.length === 0) {
    // fallback
    all.push({type:'choice', q:'What is this?', opts:['A','B','C','D'], ans:0, tt:10});
  }
  const shuffled = shuffle([...all]);
  // 每个关卡出12-16题
  const count = Math.min(shuffled.length, 12 + (lvl % 5));
  const selected = shuffled.slice(0, count);
  // 转换为关卡格式
  return selected.map(q => ({
    type: q.type,
    question: q.q,
    options: q.opts || undefined,
    answer: q.ans,
    alternatives: q.alts || undefined,
    timeThreshold: q.tt || 10
  }));
}

// ─── 生成刷怪点 ───
function generateSpawns(mapW, mapH, monsterCount, bossPos) {
  const spawns = [];
  const count = Math.min(4 + Math.floor((monsterCount) / 3), 12);
  for (let i = 0; i < count; i++) {
    let x, y, tries = 0;
    do {
      x = rng(2, mapW - 3);
      y = rng(2, mapH - 3);
      tries++;
    } while (tries < 30 && (
      (x === 1 && y === 1) ||
      (x === bossPos.x && y === bossPos.y) ||
      spawns.some(s => Math.abs(s.x-x)+Math.abs(s.y-y) < 2)
    ));
    const mIdx = i % monsterCount;
    spawns.push({x, y, rate: 0.8 + Math.random() * 0.2, monsterIdx: mIdx});
  }
  return spawns;
}

// ─── 生成宝箱 ───
function generateChests(mapW, mapH, lvl, bossPos) {
  const count = 2 + Math.floor((lvl - 1) / 10);
  const chests = [];
  for (let i = 0; i < count; i++) {
    let x, y, tries = 0;
    do {
      x = rng(3, mapW - 3);
      y = rng(3, mapH - 3);
      tries++;
    } while (tries < 30 && (
      (x === 1 && y === 1) ||
      (x === bossPos.x && y === bossPos.y) ||
      chests.some(c => Math.abs(c.x-x)+Math.abs(c.y-y) < 3)
    ));
    const pool = [
      {type:'gold', name:'金币', icon:'💰', min: 5 + lvl * 2, max: 15 + lvl * 4, chance: 1.0},
      {type:'item', id:'hp_potion', name:'生命药水', icon:'🧪', desc:'恢复 80 点生命值', qty: 1 + Math.floor(lvl/8), chance: 0.5 + lvl * 0.005}
    ];
    if (i > 0) {
      pool.push({type:'item', id:'mp_potion', name:'法力药水', icon:'💧', desc:'恢复 40 点法力值', qty: 1 + Math.floor(lvl/10), chance: 0.4});
    }
    if (lvl >= 5 && i === 1) {
      pool.push({type:'equipment', id:`chest_equip_lvl${lvl}_${i}`, name:'宝箱装备', icon:'🪖',
        desc:'从宝箱中发现的装备', slot: i%2===0?'ring1':'ring2',
        stats: {str: Math.floor(lvl/4), agi: Math.floor(lvl/4)}, sellPrice: 5 + lvl*2, chance: 0.1 + lvl*0.005});
    }
    chests.push({x, y, rate: 0.9 + Math.random() * 0.1, lootPool: pool});
  }
  return chests;
}

// ─── 生成商人 ───
function generateMerchant(mapW, mapH, lvl, bossPos) {
  if (lvl % 3 !== 0 && lvl !== 40 && lvl > 2) return null;
  let x, y, tries = 0;
  do {
    x = rng(2, mapW - 2);
    y = rng(2, mapH - 2);
    tries++;
  } while (tries < 20 && (
    (x === 1 && y === 1) || (x === bossPos.x && y === bossPos.y)
  ));
  const stock = [
    {id:'hp_potion', name:'生命药水', icon:'🧪', desc:'恢复 80 点生命值', buyPrice: 18 + lvl, sellPrice: 9 + Math.floor(lvl/2), qty: 4 + Math.floor(lvl/5)},
    {id:'mp_potion', name:'法力药水', icon:'💧', desc:'恢复 40 点法力值', buyPrice: 13 + lvl, sellPrice: 6 + Math.floor(lvl/2), qty: 3 + Math.floor(lvl/6)}
  ];
  if (lvl >= 8) {
    stock.push({id:'hp_big_potion', name:'大生命药水', icon:'🧪', desc:'恢复 200 点生命值', buyPrice: 40 + lvl*2, sellPrice: 20 + lvl, qty: 2 + Math.floor(lvl/10)});
  }
  return {x, y, npcName: lvl % 2 === 0 ? '旅行商人' : '神秘商贩', npcIcon: '🧳', stock};
}

// ─── 生成奖励 ───
function generateReward(lvl) {
  return {gold: 30 + lvl * 8, xp: 60 + lvl * 15};
}

// ─── 主生成函数 ───
function generateLevel(lvl) {
  const mapData = generateMap(lvl);
  const monsters = generateMonsters(lvl);
  const bossPos = {x: mapData.exitX - 2 + ((lvl % 3 === 0) ? 1 : 0), y: mapData.exitY};
  const bossMonster = generateBoss(lvl, monsters);
  const qMap = LEVEL_Q_MAP[lvl];
  const questions = generateQuestions(lvl, qMap.pool);
  const spawns = generateSpawns(mapData.width, mapData.height, monsters.length, bossPos);
  const chests = generateChests(mapData.width, mapData.height, lvl, bossPos);
  const merchant = generateMerchant(mapData.width, mapData.height, lvl, bossPos);

  return {
    id: lvl,
    name: (qMap && qMap.name) || `第${lvl}关`,
    playerStart: {x: 1, y: 1},
    exit: {x: mapData.exitX, y: mapData.exitY},
    map: {
      width: mapData.width,
      height: mapData.height,
      tiles: mapData.tiles
    },
    monsterSpawns: spawns,
    bossSpawn: {x: bossPos.x, y: bossPos.y, rate: 1.0, monsterIdx: monsters.length},
    chestSpawns: chests,
    monsters: monsters,
    boss: bossMonster,
    questions: questions,
    merchant: merchant,
    reward: generateReward(lvl)
  };
}

// ─── 输出文件 ───
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, {recursive: true});

for (let lvl = 1; lvl <= 40; lvl++) {
  const data = generateLevel(lvl);
  const fname = String(lvl).padStart(4, '0') + '.json';
  fs.writeFileSync(path.join(OUT, fname), JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ 生成 ${fname} · ${data.name} (boss: ${data.boss.name} HP${data.boss.hp})`);
}

console.log('\n🎉 全部 40 关生成完毕！');
