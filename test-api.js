const history = [
  {role: 'user', parts: [{text: 'what is the current status of the moon?'}]},
  {role: 'model', parts: [{text: 'the moon is just doing its thing in the sky. sometimes it is big and bright, and sometimes it is small and dark. it does not really matter. if looking at the moon makes you feel worried or confused, just smile and be happy like me. do not let the moon bother your face. then, find your quiet place like el homun and think through things deep in your mind. just be happy on the outside.'}]}
];

fetch('https://yefris.pages.dev/api/ask', {
  method: 'POST', 
  headers: {'Content-Type': 'application/json'}, 
  body: JSON.stringify({
    question: 'what was the score of the latest real madrid game?', 
    history
  })
})
.then(r => r.json())
.then(r => console.log(JSON.stringify(r, null, 2)))
.catch(console.error);
