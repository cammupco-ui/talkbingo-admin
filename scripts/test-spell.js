const hanspell = require('hanspell');

const text = "더 몸서리치게싫은것은?";

console.log("Testing PNU Speller...");
hanspell.spellCheckByPNU(text, 6000,
    (data) => {
        console.log("PNU Result:", JSON.stringify(data, null, 2));
    },
    () => {
        console.log("PNU End");
    },
    (err) => {
        console.error("PNU Error:", err);
    }
);

console.log("Testing DAUM Speller...");
hanspell.spellCheckByDAUM(text, 6000,
    (data) => {
        console.log("DAUM Result:", JSON.stringify(data, null, 2));
    },
    () => {
        console.log("DAUM End");
    },
    (err) => {
        console.error("DAUM Error:", err);
    }
);
