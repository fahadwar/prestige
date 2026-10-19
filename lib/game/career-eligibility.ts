import reviewData from '../../data/career/review.json';
import approvedIds from '../../data/career/approved.json';
export type CareerStep={team_id:number|null;team_name:string|null;start_date:string|null;end_date:string|null;role_name:string|null};
export type CareerReview={playerId:number;handle:string;reviewStatus:string;history:CareerStep[];checks:Record<string,boolean>;evidence:{kind:string;source:string}[];verifiedScope?:{firstStart:string;stepCount:number;lastStart:string;lastRole:string}};
const requiredChecks=['firstCodTeamVerified','allStintsVerified','allGapsExplained','challengersAndAcademyVerified','historicalNamesVerified','latestStatusVerified','retirementVerifiedIfApplicable'];
export function isCompleteCareer(review:CareerReview){
 if(review.reviewStatus!=='verified'||!requiredChecks.every(k=>review.checks[k]===true))return false;
 if(!['career-start','full-history','current-status'].every(kind=>review.evidence.some(e=>e.kind===kind&&/^https:\/\//.test(e.source))))return false;
 const steps=review.history,scope=review.verifiedScope;if(!scope||scope.stepCount!==steps.length||scope.firstStart!==steps[0]?.start_date||scope.lastStart!==steps.at(-1)?.start_date||scope.lastRole!==steps.at(-1)?.role_name)return false;
 if(!steps.length||steps.some(s=>!s.start_date||!s.role_name||s.team_id!==null&&!s.team_name))return false;
 // The approved record must account for every interval and all roles; no
 // silently inferred free agency, clipped histories or team-only filtering.
 for(let i=0;i<steps.length;i++){
  const s=steps[i];if(s.end_date&&s.end_date<s.start_date!)return false;
  if(i&&steps[i-1].end_date!==s.start_date)return false;
 }
 return steps.at(-1)?.end_date===null;
}
const reviews=reviewData.candidates as unknown as CareerReview[];
export const eligibleCareers=reviews.filter(r=>(approvedIds as number[]).includes(r.playerId)&&isCompleteCareer(r));
export const careerReady=eligibleCareers.length>0;
