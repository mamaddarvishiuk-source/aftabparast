const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const wordPacks = require('./wordPacks');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── In-memory room store ─────────────────────────────────────────────
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function normalizeText(text) {
  return text
    .replace(/ك/g, 'ک').replace(/ي/g, 'ی')
    .replace(/\u200c/g, ' ').trim();
}

function getPublicRoom(room) {
  const r = { ...room };
  // Never expose secret word to all
  if (r.round) {
    const pub = { ...r.round };
    delete pub.secretWord;
    delete pub.chameleonIds;
    r.round = pub;
  }
  return r;
}

function getRoomForPlayer(room, playerId) {
  const r = JSON.parse(JSON.stringify(room));
  if (r.round) {
    const isChameleon = r.round.chameleonIds && r.round.chameleonIds.includes(playerId);
    if (isChameleon) {
      delete r.round.secretWord;
    }
    delete r.round.chameleonIds;
  }
  return r;
}

function pickRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startRound(room) {
  const { settings } = room;

  // Pick pack & topic
  let pack;
  if (settings.selectedPack === 'random' || !settings.selectedPack) {
    const allPacks = [...wordPacks, ...(room.customPacks || [])];
    pack = pickRandomItem(allPacks);
  } else {
    const allPacks = [...wordPacks, ...(room.customPacks || [])];
    pack = allPacks.find(p => p.id === settings.selectedPack) || pickRandomItem(allPacks);
  }

  const topicObj = pickRandomItem(pack.topics);
  const secretWord = pickRandomItem(topicObj.words);

  // Assign chameleons
  const playerIds = room.players.map(p => p.id);
  const numChameleons = settings.twoChameleons && playerIds.length >= 8 ? 2 : 1;
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const chameleonIds = shuffled.slice(0, numChameleons);

  // Speaking order
  const order = [...playerIds].sort(() => Math.random() - 0.5);

  room.round = {
    phase: 'reveal',         // reveal → speaking → voting → guessing → scores
    pack: pack.name,
    topic: topicObj.topic,
    secretWord,
    chameleonIds,
    order,
    currentSpeakerIndex: 0,
    revealedPlayers: [],
    typedClues: {},           // playerId -> clue string
    cluesSubmitted: [],       // playerIds who submitted
    votes: {},                // voterId -> accusedId
    guessResult: null,        // chameleon's guess
    roundNumber: (room.roundNumber || 0) + 1,
  };
  room.roundNumber = room.round.roundNumber;
  room.phase = 'reveal';
}

// ─── Socket events ────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // room:create
  socket.on('room:create', ({ nickname, sessionId }) => {
    nickname = normalizeText(nickname || '');
    if (!nickname || nickname.length < 2) {
      return socket.emit('error', { msg: '🤔 اسمت رو درست بنویس، حداقل ۲ حرف!' });
    }

    let code;
    do { code = generateRoomCode(); } while (rooms[code]);

    const playerId = sessionId || uuidv4();
    const player = { id: playerId, name: nickname, isReady: false, score: 0, connected: true, socketId: socket.id };

    rooms[code] = {
      roomCode: code,
      hostId: playerId,
      players: [player],
      phase: 'lobby',
      settings: {
        mode: 'hazouri',        // hazouri | onlayn | tamrini
        timerSeconds: 20,
        revealSeconds: 10,
        twoChameleons: false,
        hardMode: false,
        easyMode: false,
        familyMode: false,
        selectedPack: 'random',
        pointsWhenCaught: 2,
        pointsChameleonEvade: 2,
        pointsChameleonGuess: 1,
      },
      customPacks: [],
      roundNumber: 0,
      round: null,
    };

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerId = playerId;

    socket.emit('room:created', { roomCode: code, playerId, room: rooms[code] });
  });

  // room:join
  socket.on('room:join', ({ roomCode, nickname, sessionId }) => {
    roomCode = (roomCode || '').toUpperCase().trim();
    nickname = normalizeText(nickname || '');

    if (!rooms[roomCode]) {
      return socket.emit('error', { msg: '😵 این اتاق وجود نداره! کد رو چک کن.' });
    }
    if (!nickname || nickname.length < 2) {
      return socket.emit('error', { msg: '🤔 اسمت رو درست بنویس!' });
    }

    const room = rooms[roomCode];

    // Reconnect support
    const existingPlayer = room.players.find(p => p.id === sessionId);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.socketId = socket.id;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.playerId = existingPlayer.id;
      socket.emit('room:joined', { roomCode, playerId: existingPlayer.id, room: getRoomForPlayer(room, existingPlayer.id) });
      socket.to(roomCode).emit('room:updated', getPublicRoom(room));
      return;
    }

    if (room.phase !== 'lobby') {
      return socket.emit('error', { msg: '🙅 بازی شروع شده! نمیشه الان وارد شی.' });
    }
    if (room.players.length >= 12) {
      return socket.emit('error', { msg: '😅 اتاق پره! جای خالی نیست.' });
    }
    // Duplicate name check
    if (room.players.some(p => p.name === nickname)) {
      return socket.emit('error', { msg: '😬 این اسم قبلاً گرفته شده! یه اسم دیگه انتخاب کن.' });
    }

    const playerId = sessionId || uuidv4();
    room.players.push({ id: playerId, name: nickname, isReady: false, score: 0, connected: true, socketId: socket.id });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;

    socket.emit('room:joined', { roomCode, playerId, room: getRoomForPlayer(room, playerId) });
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: `🎉 ${nickname} وارد اتاق شد!`, type: 'info' });
  });

  // room:ready
  socket.on('room:ready', ({ ready }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) player.isReady = !!ready;
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
  });

  // room:updateSettings
  socket.on('room:updateSettings', (settings) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return socket.emit('error', { msg: '⛔ فقط هاست میتونه تنظیمات رو عوض کنه!' });
    room.settings = { ...room.settings, ...settings };
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: '⚙️ تنظیمات آپدیت شد!', type: 'success' });
  });

  // room:kick
  socket.on('room:kick', ({ targetId }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return socket.emit('error', { msg: '⛔ فقط هاست میتونه بازیکن رو اخراج کنه!' });
    const target = room.players.find(p => p.id === targetId);
    if (!target) return;
    room.players = room.players.filter(p => p.id !== targetId);
    const targetSocket = [...io.sockets.sockets.values()].find(s => s.data.playerId === targetId);
    if (targetSocket) {
      targetSocket.emit('room:kicked', { msg: '👢 هاست تو رو از بازی اخراج کرد!' });
      targetSocket.leave(roomCode);
    }
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: `👢 ${target.name} از اتاق اخراج شد`, type: 'warning' });
  });

  // room:transferHost
  socket.on('room:transferHost', ({ targetId }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return;
    room.hostId = targetId;
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: '👑 هاست جدید انتخاب شد!', type: 'info' });
  });

  // room:addCustomPack
  socket.on('room:addCustomPack', (pack) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return;
    pack.id = 'custom_' + uuidv4().slice(0, 8);
    room.customPacks = room.customPacks || [];
    room.customPacks.push(pack);
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: '📦 پک جدید اضافه شد!', type: 'success' });
  });

  // game:startRound
  socket.on('game:startRound', () => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return socket.emit('error', { msg: '⛔ فقط هاست میتونه بازی رو شروع کنه!' });
    if (room.players.length < 3) return socket.emit('error', { msg: '😅 حداقل ۳ نفر لازمه!' });

    startRound(room);
    room.phase = 'reveal';

    // Send personalized reveal to each player
    room.players.forEach(p => {
      const isChameleon = room.round.chameleonIds.includes(p.id);
      const targetSocket = [...io.sockets.sockets.values()].find(s => s.data.playerId === p.id);
      if (targetSocket) {
        targetSocket.emit('game:roundStarted', {
          round: {
            ...room.round,
            secretWord: isChameleon ? null : room.round.secretWord,
            isChameleon,
            chameleonIds: undefined,
          },
          settings: room.settings,
        });
      }
    });
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
  });

  // game:revealAck — player confirmed they saw their word
  socket.on('game:revealAck', () => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round) return;
    if (!room.round.revealedPlayers.includes(playerId)) {
      room.round.revealedPlayers.push(playerId);
    }
    // When all players acked, move to speaking phase
    if (room.round.revealedPlayers.length >= room.players.length) {
      room.round.phase = 'speaking';
      room.phase = 'speaking';
      io.to(roomCode).emit('game:phaseChanged', { phase: 'speaking', round: getPublicRoom(room).round });
    } else {
      io.to(roomCode).emit('game:revealProgress', { count: room.round.revealedPlayers.length, total: room.players.length });
    }
  });

  // game:nextSpeaker — host advances to next speaker
  socket.on('game:nextSpeaker', () => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round || room.hostId !== playerId) return;
    room.round.currentSpeakerIndex++;
    if (room.round.currentSpeakerIndex >= room.round.order.length) {
      // All spoke → go to voting (online mode) or directly voting (hazouri)
      room.round.phase = 'voting';
      room.phase = 'voting';
      io.to(roomCode).emit('game:phaseChanged', { phase: 'voting', round: getPublicRoom(room).round });
    } else {
      io.to(roomCode).emit('game:phaseChanged', { phase: 'speaking', round: getPublicRoom(room).round });
    }
  });

  // game:submitClue (online mode)
  socket.on('game:submitClue', ({ clue }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round) return;
    clue = normalizeText(clue);
    if (!clue) return socket.emit('error', { msg: '😶 یه کلمه بنویس!' });
    if (room.round.typedClues[playerId]) return socket.emit('error', { msg: '✋ قبلاً سرنخ دادی!' });
    room.round.typedClues[playerId] = clue;
    room.round.cluesSubmitted.push(playerId);
    io.to(roomCode).emit('game:clueSubmitted', { playerId, clue, submittedCount: room.round.cluesSubmitted.length, total: room.players.length });
    // All submitted → voting
    if (room.round.cluesSubmitted.length >= room.players.length) {
      room.round.phase = 'voting';
      room.phase = 'voting';
      io.to(roomCode).emit('game:phaseChanged', { phase: 'voting', round: { ...getPublicRoom(room).round, typedClues: room.round.typedClues } });
    }
  });

  // game:vote
  socket.on('game:vote', ({ accusedId }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round || room.round.phase !== 'voting') return;
    if (room.round.votes[playerId]) return socket.emit('error', { msg: '🗳️ قبلاً رأی دادی!' });
    if (playerId === accusedId) return socket.emit('error', { msg: '😂 به خودت رأی نده!' });
    room.round.votes[playerId] = accusedId;
    io.to(roomCode).emit('game:voteReceived', { votedCount: Object.keys(room.round.votes).length, total: room.players.length });

    // All voted → tally
    if (Object.keys(room.round.votes).length >= room.players.length) {
      tallyVotes(room, roomCode);
    }
  });

  // game:forceReveal — host can force reveal
  socket.on('game:forceReveal', () => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round || room.hostId !== playerId) return;
    tallyVotes(room, roomCode);
  });

  // game:guessWord — chameleon guesses
  socket.on('game:guessWord', ({ guess }) => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || !room.round || room.round.phase !== 'guessing') return;
    const isChameleon = room.round.chameleonIds.includes(playerId);
    if (!isChameleon) return;

    guess = normalizeText(guess);
    const correct = guess === room.round.secretWord;
    room.round.guessResult = { playerId, guess, correct };

    // Score
    if (correct) {
      const chameleon = room.players.find(p => p.id === playerId);
      if (chameleon) chameleon.score += room.settings.pointsChameleonGuess || 1;
      io.to(roomCode).emit('toast', { msg: `😱 ${chameleon?.name} کلمه رو حدس زد! +${room.settings.pointsChameleonGuess || 1} امتیاز`, type: 'warning' });
    } else {
      room.players.forEach(p => {
        if (!room.round.chameleonIds.includes(p.id)) p.score += room.settings.pointsWhenCaught || 2;
      });
      io.to(roomCode).emit('toast', { msg: `🎉 آفتاب‌پرست اشتباه حدس زد! همه +${room.settings.pointsWhenCaught || 2} امتیاز`, type: 'success' });
    }

    room.round.phase = 'scores';
    room.phase = 'scores';
    io.to(roomCode).emit('game:phaseChanged', {
      phase: 'scores',
      round: { ...getPublicRoom(room).round, secretWord: room.round.secretWord, guessResult: room.round.guessResult },
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  });

  // game:nextRound
  socket.on('game:nextRound', () => {
    const { roomCode, playerId } = socket.data;
    const room = rooms[roomCode];
    if (!room || room.hostId !== playerId) return;
    room.phase = 'lobby';
    room.round = null;
    room.players.forEach(p => p.isReady = false);
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('game:phaseChanged', { phase: 'lobby' });
  });

  // room:leave
  socket.on('room:leave', () => handleLeave(socket));
  socket.on('disconnect', () => handleLeave(socket));
});

function tallyVotes(room, roomCode) {
  const votes = room.round.votes;
  const tally = {};
  Object.values(votes).forEach(id => { tally[id] = (tally[id] || 0) + 1; });
  const maxVotes = Math.max(0, ...Object.values(tally));
  const topVoted = Object.keys(tally).filter(id => tally[id] === maxVotes);
  const caughtChameleons = topVoted.filter(id => room.round.chameleonIds.includes(id));
  const caught = caughtChameleons.length > 0;

  if (!caught) {
    // Chameleon evades
    room.round.chameleonIds.forEach(cId => {
      const ch = room.players.find(p => p.id === cId);
      if (ch) ch.score += room.settings.pointsChameleonEvade || 2;
    });
    room.round.phase = 'scores';
    room.phase = 'scores';
    io.to(roomCode).emit('game:phaseChanged', {
      phase: 'scores',
      round: {
        ...getPublicRoom(room).round,
        secretWord: room.round.secretWord,
        tally,
        caught: false,
        chameleonNames: room.round.chameleonIds.map(id => room.players.find(p => p.id === id)?.name),
      },
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
    io.to(roomCode).emit('toast', { msg: `🦎 آفتاب‌پرست فرار کرد! کسی نشناختش`, type: 'warning' });
  } else {
    // Caught → let chameleon guess
    room.round.phase = 'guessing';
    room.phase = 'guessing';
    room.round.tally = tally;
    io.to(roomCode).emit('game:phaseChanged', {
      phase: 'guessing',
      round: {
        ...getPublicRoom(room).round,
        tally,
        caught: true,
        chameleonIds: room.round.chameleonIds,
        chameleonNames: room.round.chameleonIds.map(id => room.players.find(p => p.id === id)?.name),
      },
    });
    io.to(roomCode).emit('toast', { msg: '🔍 آفتاب‌پرست لو رفت! حالا باید کلمه رو حدس بزنه', type: 'info' });
  }
}

function handleLeave(socket) {
  const { roomCode, playerId } = socket.data || {};
  if (!roomCode || !rooms[roomCode]) return;
  const room = rooms[roomCode];
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.connected = false;
    io.to(roomCode).emit('room:updated', getPublicRoom(room));
    io.to(roomCode).emit('toast', { msg: `📴 ${player.name} قطع شد`, type: 'warning' });
  }
  // Clean up empty rooms after a delay
  setTimeout(() => {
    if (rooms[roomCode] && rooms[roomCode].players.every(p => !p.connected)) {
      delete rooms[roomCode];
    }
  }, 300000); // 5 min
}

// REST endpoint for word packs list
app.get('/api/packs', (req, res) => {
  res.json(wordPacks.map(p => ({ id: p.id, name: p.name, topicCount: p.topics.length })));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🦎 آفتاب‌پرست server running on port ${PORT}`));
