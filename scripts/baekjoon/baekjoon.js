// Set to true to enable console log
const debug = true;

/* 
  문제 제출 맞음 여부를 확인하는 함수
  2초마다 문제를 파싱하여 확인
*/
let loader;

const currentUrl = window.location.href;
log(currentUrl);

// 문제 제출 사이트의 경우에는 로더를 실행하고, 유저 페이지의 경우에는 버튼을 생성한다.
// 백준 사이트 로그인 상태이면 username이 있으며, 아니면 없다.
// const username = findUsername();
if (['status', 'problem_id', 'from_mine=1'].every((key) => currentUrl.includes(key))) startLoader();
// else if (currentUrl.match(/\.net\/problem\/\d+/) !== null) parseProblemDescription();

function startLoader() {
  loader = setInterval(async () => {
    // 기능 Off시 작동하지 않도록 함
    const enable = await checkEnable(); // storage 관련... 필요?
    if (!enable) stopLoader();
    else if (isExistResultTable()) {
      const table = findFromResultTable();//결과 테이블 파싱
      if (isEmpty(table)) return;
      const data = table[0];
      if (data.hasOwnProperty('resultCategory')) {
        const { resultCategory } = data;
        if (resultCategory.includes(RESULT_CATEGORY.RESULT_ACCEPTED) ||
          resultCategory.includes(RESULT_CATEGORY.RESULT_ENG_ACCEPTED)) {
          stopLoader();
          console.log('풀이가 맞았습니다. 업로드를 시작합니다.');
          const bojData = await findData();//0222 추가 수정 필요
          await beginUpload(bojData);
        }
      }
    }
  }, 2000);
}

function stopLoader() {
  clearInterval(loader);
  loader = null;
}

function toastThenStopLoader(toastMessage, errorMessage) {
  Toast.raiseToast(toastMessage)
  stopLoader()
  throw new Error(errorMessage)
}

/* 파싱 직후 실행되는 함수 */
async function beginUpload(bojData) {
  log('bojData', bojData);
  if (isNotEmpty(bojData)) {
    //console.log(bojData);
    startUpload(bojData.problemId); // 테이블 애니메이션 및 타이머 작동
  }
}