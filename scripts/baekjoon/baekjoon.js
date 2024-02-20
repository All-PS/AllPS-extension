// Set to true to enable console log
const debug = false;

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
else if (currentUrl.match(/\.net\/problem\/\d+/) !== null) parseProblemDescription();

function startLoader() {
  loader = setInterval(async () => {
    // 기능 Off시 작동하지 않도록 함
    // 크롬 로컬 스토리지에서 개체 가져오는 건데 뭘 가져오지 
    // 최근 업로드한? 혹은 파싱한 문제 정보 및 제출 번호 소스코드
    const enable = await checkEnable();
    if (!enable) stopLoader();
    else if (isExistResultTable()) {
      const table = findFromResultTable();
      if (isEmpty(table)) return;
      const data = table[0];
      if (data.hasOwnProperty('resultCategory')) {
        const { resultCategory } = data;
        if (resultCategory.includes(RESULT_CATEGORY.RESULT_ACCEPTED) ||
          resultCategory.includes(RESULT_CATEGORY.RESULT_ENG_ACCEPTED)) {
          stopLoader();
          console.log('풀이가 맞았습니다. 업로드를 시작합니다.');
          startUpload();
          const bojData = await findData();
          // 서버 업로드 부분... 추후 개발 근데 어떻게 하지?
          // await beginUpload(bojData);
          console.log('테스트', bojData);
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
    const stats = await getStats();
    const hook = await getHook();

    const currentVersion = stats.version;
    /* 버전 차이가 발생하거나, 해당 hook에 대한 데이터가 없는 경우 localstorage의 Stats 값을 업데이트하고, version을 최신으로 변경한다
    
    이건 뭐지???????????????????
    크롬 로컬 스토리지 사용하여... 
    */
    if (isNull(currentVersion) || currentVersion !== getVersion() || isNull(await getStatsSHAfromPath(hook))) {
      await versionUpdate();
    }

    /* 현재 제출하려는 소스코드가 기존 업로드한 내용과 같다면 중지
    
    아래 내용은 추후 DB에 업로드 시 참고
    */
    cachedSHA = await getStatsSHAfromPath(`${hook}/${bojData.directory}/${bojData.fileName}`)
    calcSHA = calculateBlobSHA(bojData.code)
    log('cachedSHA', cachedSHA, 'calcSHA', calcSHA)

    if (cachedSHA == calcSHA) {
      markUploadedCSS(stats.branches, bojData.directory);
      console.log(`현재 제출번호를 업로드한 기록이 있습니다.` /* submissionID ${bojData.submissionId}` */);
      return;
    }
    /* 신규 제출 번호라면 새롭게 커밋  */
    await uploadOneSolveProblemOnGit(bojData, markUploadedCSS);
  }
}

async function versionUpdate() {
  log('start versionUpdate');
  const stats = await updateLocalStorageStats();
  // update version.
  stats.version = getVersion();
  await saveStats(stats);
  log('stats updated.', stats);
}
