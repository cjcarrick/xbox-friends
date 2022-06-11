"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = require("cross-fetch");
const fs_1 = require("fs");
const path_1 = require("path");
const checkedCookies = [
    'MSPAuth',
    'WLSSC',
    'csrf',
    // 'XBXXtkhttp://xboxlive.com',
    'X-FD-FEATURES'
    // 'RPSSecAuth'
];
const defaultToken = {
    Token: 'eyJlbmMiOiJBMTI4Q0JDK0hTMjU2IiwiYWxnIjoiUlNBLU9BRVAiLCJjdHkiOiJKV1QiLCJ6aXAiOiJERUYiLCJ4NXQiOiIxZlVBejExYmtpWklFaE5KSVZnSDFTdTVzX2cifQ.klO8rk6mm7v_kWJ3CToGx8mspftEVZIwVbxyvxTNaljvlX1s3M7ogBvx7_4908fDtCtXmcc1rpfF77T0Zo-VNeaIsDF_Nda1tPT_8ibgy5sY53Ur6YogUfc89MKSZqM41CBvPicrYEkNMNQu5JouWIbzcyqvmaQaXp3SCvbtqFs.Al3rfFYjl8nvfV6tZp1TvQ.b7reVHQPkRU8XLGsbhSY_AF4Maff3ck7VKJCHbcoz6YMexX7GhEdXMMwT2PdF0q82a0auqbvz_kiWM23WmySFdZYSq3FK1_kEhS8WihuZ-nJT5pibbJtxDNmUF2rIgVWqFm7aImVEvgLlecA5GiG2DM0Hd2FRO2MazDbaj_UCXper0tFt4WyXSggoQlm2OkpT7frCm5GLLX2ppepE9IiUnqXxVEYQoc5k4zxYP8YCC6QUN2-167fn5if19wWvFKoJG15aKzYbw5pQpqLgCHwr634zoY4l3cEx0I9hIepwHAOP0udvkxqFsw5bjqNIoMGZTziX7hJpIDHfxP9VT50JSSWpZWrIqDXgZY073btXIMbxnboMT1pdAzvJP5ykTeh8X9aNcfs1uZSqfL9sAdVWf_xJOY8p-TM9kQd8KHiWBFoMbCn7qQb98Cv8ahtTd3MYS2yQ9QeADa5p5c-e7iKSfkSTqH3to-2o8Q_0TGGb0L_tPUGZqanG4t65m0kESBYHbVSzo4dhz2FzGRyB24Zo8uSM3nGUhf1BqhxJZchB62mX1i0iTtkc-Qa4maXZDhjneHsIlP9iGuuCyHyp7jc9HAbWxCqQTjBtWVoamcRp5GX4FSoPsWVJFCyPiXQj1fzPQnps93StQBwVUYbjL51ruJx7i48HPT4MZtz0mT9AM7BvssD0mB8OlrnGJLzPIPBf9k9JHO4Xttjj2yKhJr0SLS_k-g4XApId-XhQ3WMqIugXdQ8XbBRiy28JlskiN0SwxUUjgGTQ2gir4sCh048gz2ydSwe41QbImB0OkkER6TFIr7CVmnD0-w_Ps_AkzWuXWRMcX9qi_wwb8vre26HNQDF0kIVVgasu3iUgtA1q8Zf0Vn6cVDxBqa79tobnL_61YedL3uNExwtRQuyV_fBiry2613qfg12mbdmqOdZmqcj25wpy_pPRfC56zBugLAv9s5pOg_1qUnAoXY6Erc9xpCns0gFqVW7C4b0aJcxGttdywqVlgjY3FCJaqH3uklB4zFf4tPF6UaL3SkN9Y9Z-8zi7XsB9Olmv-667tapJWmitg2qhxfz9bWwO9ampzjXrSG9Xmiabuv3XP1vcrXvTzSRu4jdpS6Fs8BcrCrjy5yvxrCjzBhprCtXyaR1mDAgBFzjEoUIoD17fM7fCMi16PxErqCe3-jKF0iCrYoyKewr1uyeS03kTk2StrNnZBtK5gt5XwTedIJkndQBIBzH-mGtN-h0YvagI5VVqDMAv2C0c1hVphkGbt066SD2z9FQPhAsZVudP7UpLwIwW9UtCGqHR4phs3b_9dWSKZ1ESa0xMmKLtEl36tH5X46hcBwMSl9ArgUYubdteXf-4GAfyMmilziwCRiakEQdT-nP33VjwzWTQWhQtuvlz2LF1vw3tmyr24rokc1jevxldyMmij0V83saxKhIc8Pllb7xxqdMfNM_pJrIowxYrcAvMtjil-IjHVUXSLNDooIWTtiKaJye_nYiT17lQDUpvab7vbA.93PGrvbqTU46Sf8JOBkAIP48yk6G5WlTAHz13-Mh1YE',
    Expires: '2022-06-12T09:51:06.5015038Z',
    TokenHash: 'ZATfHk8GKXVnB1I8fhsYefdPPRG4pGh7Dn4Oy+J+V8A=',
    ParentUserClaims: null,
    UserClaims: {
        agg: 'Adult',
        gtg: 'sac396',
        prv: '184+185+186+187+188+191+192+193+194+195+196+198+199+200+201+203+204+205+206+207+208+211+214+215+216+217+220+224+227+228+235+238+245+247+249+252+254+255',
        xid: '2535458902090958',
        uhs: '12257579151544217865'
    },
    ChildAccountCreationToken: null
};
const requestBody = {
    FilterType: 0,
    SearchText: '',
    SuggestionFilter: 0,
    SuggestionFilterSelected: false,
    XboxTitleId: 0,
    ShowMixerContent: false,
    UseGamerTag: false,
    OverrideFromQueryString: false,
    ShowHeader: true,
    ShowFilter: true,
    ShowSearch: true,
    ShowGroupHeaders: true,
    EnableFriendFinder: true,
    AllSuggestionFlag: false,
    WebApiUrl: '/en-us/social/api/Friends?',
    Layout: 0
};
const friends = async (params, mimickChromium = false) => {
    const { body = requestBody, csrf, RPSSecAuth } = params;
    return await (await cross_fetch_1.default('https://account.xbox.com/en-us/social/api/Friends?', {
        headers: {
            __requestverificationtoken: csrf,
            Cookie: `csrf=token=${csrf}; RPSSecAuth=${RPSSecAuth}`,
            'onerf-spa': '1'
        },
        body: JSON.stringify(body),
        method: `POST`
    })).json();
};
main();
async function main() {
    fs_1.writeFileSync(path_1.default.join(__dirname, './result.json'), JSON.stringify(await friends({
        csrf: 'zAntfodLo6BBq88l6AViGMYgEfsQ0Ro3Yf1c0k8XciLY1whwyDpXcU9GQqZuXIgtwfJx63gVRXB39C4e3YOwHPe75cc1',
        RPSSecAuth: 'FADCBxR/eYE3tsXPBuEn8O2pHDvCk/0fTgNmAAAEgAAACLMurmRuauKwgAcYrtgQzlcgR5fkAKFlb6ACDVlg2o9J5p%2BX2/03IahEFcjXp2LkstcjteVmHhJYlQ1I%2B4Qhr0%2BwjgEtwWwuynaDPogh7kUug02D9a3WvpfkODLPYoyreDdpNOA18GKRry2K58kf5cvm5pH6y2rb2NinM3I//MZmrLQO9vYKTEaaxpEN9nuzY/OPUgy8JuOFYK3FLuwTTYOifw37uab4Mt6AMYqLMqymjDPhOLZhf0RKS616GBQWcbqjk3wwJ4A1WSjqRmO3fsaBrpEnQxakU7Uh8FkQp4erLnlIemi2uagf94Ngeb2jTgy8gzqT7U5uON2fOGyopHv83i789mv1VwSX7n/kVMdHaCcp7FJgd89NDSEs39t%2BZBd6nNfWSMvjXpXtSaZpNXkEgxlOXx%2BMuqwwZCT4QjV%2BdI7yQtZKvEf7Oz12NhQj1qO5vTFx4gaz6NrbRnnqUd8YxZ9U0592EA4IAOllFPJLWFNTDf4Wdq3ysV6sLuf0PS8GgbqQWVnuJk4zrJetEwskPmVjmvSDEm4M1NRpKdHT56iBIbFa%2BV/JdqmfasW5QJDBd6zB6FP%2Bp7Y4LdnxTbDjI%2BsrX1jkJT/UOhdP54JOcUmqp931Xtnj2rm2Cmam5%2BEVvZMqGzs3z0bdaIn7ECoIY%2BC1lyBWUbmaQl%2BO11ZrVUG%2BZbYwTGwnXAlsKcvX/9vsL1PeION32SUf11ilTasTigb3ugg0cD/5usc21%2BZPAYzB2JmhxycirH3l3ZoQQCVqMCvpmC7maWIdGkYmAVTyf6gTfaEMNNk377mM2EM%2BcMojTgx8b7MkcTIEY7c9M81CMbgxQKou7DpPxy5IZ0BDmH/%2BpalzSrtQ6x4MqtrrcKPZuMsmWg%2BtIJZCmcXw2YFnK5%2BRd4SbYCvMKIX4EDn7jPEvfeuUI4x/AaXGpBk053uQtsBymGApondkBg%2BZk7hxg1aNDLXUCn07%2Bpu49HTabzkX7CG7l4qhb/lfHblH5tJGIxui1i7PvYK1nnSy91Ggl1sO0E8%2BiPLvoH060p496XsA%2BZg5uAqLL88jZcvoGdh%2BVVY7xh2QL1u4qWtW01pNBrHX4gJv/qbmUQTALO/OIvOaXFXXOAjlHVX4dY5OD0AyEz8cDsbfThCv3RHGhTZ6IqXnWcVlTImKQQuWURJCMoUSzNkUNsUNMMRvLnLhC1IOwSer2xu0Y6%2BYAzLKDAq%2B7phhx9AwEw3f5qZpg3ApKQP1ulJ%2Bag4vVvpQV4Rm/oEF82lVLu5BwfdLFkGkFkIeGDyymEogTcSDa%2BdvKii5HT0owbqu80dHS4KhhDC3HrdAIQnEDUnflyd1jlrH1uAPRBwgV10WqhuE8oAyseXNevrjWJD%2BITTYAor%2BlHdzz8ZBfBPmDzJoobPfke73f4qOlJON2ncNZuzdr2bsuMyOU3BRIIMdAVBHDKix6E%2BSYCPlf67YX/N%2BC95WmC8IJeOq0fGM6UJJnrKpFjjWeeGNsLkDTuLC5efwaESB5/%2BgiYrSvtfJQarvhlhnnRwXBNyIcp0Aq271GWFe2TDEtq3zaUOKaoK6gqqIUcJ3Jmc17%2B1o9fgRvKvgf4FDIqSLpORgsg6VsiCFe5L4fdMNElN5geSHuqBCjGrfSIv0oiDvRH8jU20uOE0YvCw8%2BZj8kAJnrCk3XUetXBLFIipyVG2mTLLcqXWcp6Ro1876VuMpzs8l7D9ARD8Z2f0XV%2ByPVyvtxKM%2BxIQDlXeBGkzCQQYhMj2EsZoojFPTxvOBtU1o48X6siA3UxymZwvNRVuo4kRKwzPw6mSqTMr3IHZ%2Bi%2BCoDv7j181dGOks5nLubj0HXqvsUW/Kwy7EJy5ac6x%2Bn4tDIhUGJ7NqrGwt7RC/KNUs6G1DOIZoiTOwkMFjtQ7Y2ohEz5n5rz2r3vTH01Rmw8dV9TjncIaQ2C7y843iRIEDpwCaIYP2ESFtwjqIb4z6TkdiDFeMORDEr8nWBlQsr0Az0yA/%2BJL8wUDKVYs2o5xeszwiDygNbc6BJDqOyZEFZttMoUcBJ5v7EmiZ9SceRm8rbeLS8%2BCwSP/O2j0Gyap0V9yJNliQQS0d8jdtEZ6VYpn7bmaXfctw/NYaq/6iNGGfAVVAGbi7Ta29gE4Ciq2HBQl67fyrLaWgQFHD88shTba7w0l%2BbKfu2roPwNt6UVitddj4FurEetF16cZQ2Z36NdSto/4EkZ1mSFdoUKAU9wLwIuLWWOwPnpAap8L2HW66kYdQ1%2BPAJVFozS6Kf8fVzjKKyihz8Y2n0LRQYVoUkyIYo/iCGSRxUwh6zO8kCfDcBhrtucr%2B5NU%2BtaxYq5OLu0434i%2B4J09YDmQLRu5hMsJ15rPM32zpJXmSYniVmDEc3zrzK4kPB6TnXJkwuL/8eWzxVZ%2BiEg9%2BHzz7Hka2XKUlNIYwCA2aYajb2v5KXLT68IwjE7W3fA7IChgJFM0CqPxJqtAcNbqfna8KxWueVBfJvTZFswMPhd3/UJ2mRLdU%2BClqOlp/oB3evlFlwnyGs0l6rC1D/WWRjWTILiaOGneBgudZ38sNCE3%2BjcM%2BZiXPKhyr%2Bdd82qIUAA74IvEh/Sn2KnoFI5VF5jxlrbAq'
    })));
}
