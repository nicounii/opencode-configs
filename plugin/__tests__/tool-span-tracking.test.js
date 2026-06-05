import { describe, it, expect, beforeEach } from 'bun:test';
import { ACTIVE, handlePartUpdated } from '../langfuse.js';

describe('Tool execution span tracking', () => {
  let mockLf;

  beforeEach(() => {
    ACTIVE.clear();
    mockLf = {
      _spans: [],
      _spanEnds: [],
      span(args) {
        this._spans.push(args);
        const capturedArgs = args;
        return {
          ...args,
          end(upd) { mockLf._spanEnds.push(upd); },
          get metadata() { return capturedArgs.metadata || {}; },
        };
      },
    };
  });

  function activeSession() {
    const sessionId = 'ses_1';
    ACTIVE.set(sessionId, {
      traceId: 'trace_1',
      generations: new Map(),
      spans: new Map(),
      fileChanges: [],
      createdAt: Date.now() / 1000,
    });
    return sessionId;
  }

 function createGeneration(messageId = 'msg_1') {
   const state = ACTIVE.get('ses_1');
   state.generations.set(messageId, { id: messageId });
 }

 function toolEvent(callID, status, overrides = {}) {
   return {
     properties: {
       part: {
         type: 'tool',
         sessionID: 'ses_1',
         messageID: 'msg_1',
         callID,
         tool: 'test_tool',
         state: { status, ...overrides },
       },
     },
   };
 }

 it('creates a span for pending tool parts', () => {
   activeSession();
   createGeneration();
   const event = toolEvent('call_1', 'pending');
   handlePartUpdated(event, mockLf);
   const state = ACTIVE.get('ses_1');
   expect(state.spans.has('call_1')).toBe(true);
 });

 it('creates a span for running tool parts', () => {
   activeSession();
createGeneration();
const event=toolEvent('call2','running');
handlePartUpdated(event,mockLf);
const state=ACTIVE.get('ses_1');
expect(state.spans.has('call2')).toBe(true);
});

it ('ends the span for completed tool parts with output' ,()=>{
activeSession() ;
createGeneration() ;
const startTime=Date.now()-1000;
const endTime=Date.now();
const pendingEvent=toolEvent ('call3','pending' ,{ time:{ start :startTime }});
handlePartUpdated (pendingEvent ,mockLf);

const completeEvent=toolEvent ('call3','completed' ,{
time:{ start :startTime ,end :endTime},
output:'result' ,
title:'Test Tool Call' ,
input:{ arg:'value'}
});
handlePartUpdated (completeEvent ,mockLf);

expect(mockLf._spanEnds).toHaveLength(1) ;
expect(mockLf._spanEnds[0].output).toBe ('result') ;
expect(mockLf._spanEnds[0].metadata.title).toBe ('Test Tool Call') ;

const state=ACTIVE.get('ses_1');
expect(state.spans.has ('call3')).toBe(false) ;
});

it ('ends the span for error tool parts with error status and metadata' ,()=>{
activeSession () ;
createGeneration() ;
const pendingEvent=toolEvent ('call4','pending') ;
handlePartUpdated (pendingEvent ,mockLf);

const errorEvent=toolEvent ('call4','error' ,{
time:{end :Date.now()},
error:'something failed'
});
handlePartUpdated (errorEvent ,mockLf);

expect(mockLf._spanEnds).toHaveLength(1) ;
expect(mockLf._spanEnds[0].status).toBe ('error') ;
expect(mockLf._spanEnds[0].metadata.error).toBe ('something failed') ;

const state=ACTIVE.get('ses_1');
expect(state.spans.has ('call4')).toBe(false);
});

it ('creates a span on-the-fly for completed without prior pending/running' ,()=>{
 activeSession () ;
 createGeneration() ;
 const completeEvent=toolEvent ('call5','completed' ,{
 time:{ start :Date.now()-1000 ,end :Date.now()},
 output:'late result'
 });
 handlePartUpdated (completeEvent,mockLf);

 const state=ACTIVE.get('ses_1') ;
 // Span is created and ended immediately — no lingering in state.spans
 expect(state.spans.size).toBe(0) ;
 expect(mockLf._spans).toHaveLength(1) ; // created
 expect(mockLf._spanEnds).toHaveLength(1) ; // ended
 });

it ('ignores non-tool parts' ,()=>{
activeSession () ;
createGeneration() ;
const nonToolEvent={
properties:{
part:{
type :'text' ,
sessionID :'ses_1'}
}
};
handlePartUpdated (nonToolEvent,mockLf);

const state=ACTIVE.get('ses_1');
expect(state.spans.size).toBe(0) ;
expect(mockLf._spans ).toHaveLength(0) ;

});

});