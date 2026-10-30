'use strict';
// A casual playtest prompt, not server-side access protection.
const ACCESS_CODE_HASH='d2cb2a3551377b86b707d5f3c46cb669c9040f10869a2f28259be48da27abfca';
const ACCESS_SESSION_KEY='myworld-playtest-'+ACCESS_CODE_HASH.slice(0,12);
async function accessCodeMatches(value,expected=ACCESS_CODE_HASH){
 const normalized=value.trim().toUpperCase();
 if(!normalized)return false;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return actual===expected;
}
function unlockPlaytest(){
 try{sessionStorage.setItem(ACCESS_SESSION_KEY,'granted')}catch{}
 document.body.classList.remove('access-locked');$('accessGate').hidden=true;$('accessCode').value='';
 $('singlePlayer')?.focus();
}
function initializeAccessGate(){
 let admitted=false;try{admitted=sessionStorage.getItem(ACCESS_SESSION_KEY)==='granted'}catch{}
 if(admitted){unlockPlaytest();return}
 $('accessGate').hidden=false;document.body.classList.add('access-locked');
 $('accessForm').onsubmit=async event=>{
  event.preventDefault();const button=$('accessSubmit');button.disabled=true;$('accessError').textContent='';
  try{
   if(await accessCodeMatches($('accessCode').value))unlockPlaytest();
   else{$('accessError').textContent='That code is not valid. Try again or contact the playtest organizer.';$('accessCode').setAttribute('aria-invalid','true');$('accessCode').focus()}
  }catch{$('accessError').textContent='The code could not be checked. Open this page using HTTPS or the local game server and try again.'}
  finally{button.disabled=false}
 };
 $('accessCode').oninput=()=>{$('accessCode').removeAttribute('aria-invalid');$('accessError').textContent=''};
 $('accessCode').focus();
}
