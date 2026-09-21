// A scripted adapter for the bundled API migration, not a model evaluation.
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);
const file=request.files.find(f=>f.path==='src/greeting.js');
if(!file)throw new Error('This fixture only supports the bundled migration');
console.log(JSON.stringify({summary:'Replace name() with displayName() as described in the migration notes.',edits:[{path:file.path,content:file.content.replaceAll('name(', 'displayName(').replace('{ name }','{ displayName }')}]}));
