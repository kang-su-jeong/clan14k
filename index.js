require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Guilds, GuildMessages, MessageContent, GuildMembers } = GatewayIntentBits;
const axios = require('axios');

const client = new Client({
    intents: [Guilds, GuildMessages, MessageContent, GuildMembers]
});

const pendingUsers = new Map();
let embedSentUsers = new Set(); // 임베드를 이미 보낸 사용자를 추적하는 Set

client.once('ready', () => {
    console.log(`${client.user.tag} 준비 완료!`);
}); // <- 여기에 중괄호 확인

client.on('guildMemberAdd', async (member) => {
    pendingUsers.set(member.id, Date.now());

    setTimeout(async () => {
        if (pendingUsers.has(member.id)) {
            try {
                await member.kick('3분 이내에 배그 아이디 등록을 하지 않음');
                console.log(`${member.user.tag}을(를) 3분 초과로 강퇴했습니다.`);
            } catch (error) {
                console.error('강퇴 실패:', error);
            }
            pendingUsers.delete(member.id);
        }
    }, 180000); // 3분 후 강퇴
}); // <- 여기에 중괄호 확인

client.on('messageCreate', async (msg) => {
    if (!msg.guild || msg.author.bot) return;

    if (msg.content === '!임베드') {
        if (embedSentUsers.has(msg.author.id)) {
            await msg.reply('임베드는 이미 한 번 전송되었습니다!');
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription('✨14K 서버의 인증을 도와주는 봇입니다✨')
            .addFields({ name: '', value: '✅ 기능 소개 ✅', inline: false })
            .addFields({ name: '신규 멤버의 가입 절차를 안내합니다. PUBG 아이디 인증을 도와드립니다.', value: '', inline: false })
            .addFields({ name: '', value: '🛠️ 명령어 사용법(관리자 전용)\n!별명 별명입력\n!등록 배그아이디\n!전적 배그아이디', inline: true })
            .setColor('Random')
            .setImage('https://cdn.discordapp.com/attachments/1365992183257108492/1366051588082241577/15k.png?ex=680f8a2e&is=680e38ae&hm=fcff4dc2c9bf7903c2d7ee5fdefd8e30aa5e5fdf5d395bb6a6f16b56a72ecd5b&');

        const targetChannel = msg.guild.channels.cache.get('1366054815016161360'); // 채널 ID
        if (targetChannel) {
            targetChannel.send({ embeds: [embed] });
            embedSentUsers.add(msg.author.id); // 임베드 보낸 사용자로 설정
            await msg.reply('임베드가 성공적으로 전송되었습니다!');
        } else {
            await msg.reply('지정한 채널을 찾을 수 없습니다.');
        }
    } // <- 여기에 중괄호 확인

    if (msg.content.startsWith('!별명 ')) {
        const newNickname = msg.content.replace('!별명 ', '').trim();
        try {
            await msg.member.setNickname(newNickname);
            await msg.reply(`별명을 "${newNickname}"(으)로 바꿨습니다.`);
        } catch (error) {
            console.error(error);
            await msg.reply('별명을 바꿀 수 없습니다. 권한이 부족합니다.');
        }
    } // <- 여기에 중괄호 확인

    if (msg.content.startsWith('!등록 ')) {
        const parts = msg.content.split(' ');
        const username = parts[1];

        if (!username) {
            await msg.reply('배그 아이디를 입력해주세요!');
            return;
        }

        try {
            const response = await axios.get(`https://op.gg/ko/pubg/user/${encodeURIComponent(username)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
                }
            });

            if (response.data.includes('검색 결과가 없습니다')) {
                await msg.reply('해당 배그 아이디를 op.gg에서 찾을 수 없습니다. 정확한 닉네임을 입력해주세요!');
                return;
            }

            const channel = msg.guild.channels.cache.find(ch => ch.name === '배그-아이디');
            if (!channel) {
                await msg.reply('배그 아이디를 전송할 채널을 찾을 수 없습니다.');
                return;
            }

            await channel.send(`배그 아이디가 등록되었습니다: ${username}\n등록자: <@${msg.author.id}>`);
            await msg.reply(`배그 아이디 "${username}"(이)가 성공적으로 등록되었습니다.`);

            const role = msg.guild.roles.cache.find(r => r.name === '승인대기중');
            if (role) {
                await msg.member.roles.add(role);
                await msg.reply('`승인대기중` 역할이 부여되었습니다.');
            }

            pendingUsers.delete(msg.author.id);

        } catch (error) {
            console.error(error);
            await msg.reply('아이디 등록 중 오류가 발생했습니다.');
        }
    } // <- 여기에 중괄호 확인

    if (msg.content.startsWith('!전적 ')) {
        const parts = msg.content.split(' ');
        const targetUser = parts[1];

        if (!targetUser) {
            await msg.reply('배그 아이디를 입력해주세요!');
            return;
        }

        const statsLink = `https://op.gg/ko/pubg/user/${encodeURIComponent(targetUser)}`;

        try {
            await msg.reply(`사용자 "${targetUser}"의 배그 전적 링크: ${statsLink}`);
        } catch (error) {
            console.error(error);
            await msg.reply('전적을 가져오는 중 오류가 발생했습니다.');
        }
    } // <- 여기에 중괄호 확인
}); // <- 여기에 중괄호 확인

client.login('process.env.TOKEN'); // 여기에 봇 토큰 입력