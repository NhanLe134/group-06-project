const fs = require('fs');

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwMTcxMTYwLCJqdGkiOiI3ZGZjZDZmMThjNTI0NzkwOTU3MTFkNGNkNTBjMzNmNCIsInVzZXJfaWQiOjk1NzIxNX0.IJC2UNvJxc1isIbNYlp2l-WRxs75X9h6mJrrHTOZZKOVWM4f5K5jVjCAOkzMF_QACX1B8CYcG9OU0o1j9PyGVXXWWuGdVSferof_3bYMXy1EJ9hMlvPOmbI08qsC0ckf4n200gaC-z6Gsdhz4T_8jwNW4R0KTwPNOjDI8friHAUOiB1T6JAoU6O3ykUp2Ege9Lbv5d1xQjomqqzumhxbltr6suALhXWgvOdhLCZ829pUmhetKJeU5kbuPgJyUS1sqxyaH-nHdrp2jkGf7-mSMZdjhr4hpxLh5qMdi11T8q03AGdMGfylI1_92RmQfvItDTWofEtRCx8jiafRiZUnWg";
const projectId = 1804530;

const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
};

async function updateStories() {
    console.log("Fetching stories from Taiga...");
    const res = await fetch(`https://api.taiga.io/api/v1/userstories?project=${projectId}`, { headers });
    const stories = await res.json();
    console.log(`Found ${stories.length} stories.`);
    
    const content = fs.readFileSync('E:/MIS3032/group-06-project/docs/04-Backlog/user-stories.md', 'utf-8').replace(/\r\n/g, '\n');
    
    for (let i = 1; i <= 8; i++) {
        const idStr = `US-0${i}`;
        const regex = new RegExp(`## ${idStr} - (.*?)\\n([\\s\\S]*?)(?=\\n## US-0|\\n# EPIC|\\n---|$)`);
        const match = regex.exec(content);
        
        if (match) {
            let title = `${idStr} - ${match[1].trim()}`;
            let description = match[2].trim();
            
            // find the story in taiga by searching for US-0X in the subject
            const target = stories.find(s => s.subject.includes(idStr));
            if (target) {
                console.log(`Updating ${title} (Taiga ID: ${target.id})...`);
                const updateRes = await fetch(`https://api.taiga.io/api/v1/userstories/${target.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        subject: title,
                        description: description,
                        version: target.version
                    })
                });
                if (updateRes.ok) {
                    console.log(`Success ${idStr}`);
                } else {
                    console.log(`Failed ${idStr}`, await updateRes.text());
                }
            } else {
                console.log(`Could not find ${idStr} on Taiga`);
            }
        } else {
             console.log(`Could not find ${idStr} in markdown`);
        }
    }
}

updateStories().catch(console.error);
