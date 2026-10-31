export function studyQuery(params: Record<string,string|string[]|undefined>) {
  const result=new URLSearchParams();
  for(const key of ['runId','questions','difficulty','stageId','sessionId','replayIds','collectionId','source','level','topic','mistakeMode']) { const value=params[key]; if(typeof value==='string')result.set(key,value); }
  return result.toString();
}
