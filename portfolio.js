const projects = {
  portfolio: {
    title: '포트폴리오 웹사이트',
    goal: '채용 담당자가 첫 화면에서 소개와 작업으로 바로 이동할 수 있도록 설계했습니다.',
    work: '작업 카드를 먼저 배치하고, 상세 내용과 연락 경로를 연결했습니다. 화면 폭에 따라 카드와 메뉴가 줄을 바꾸도록 구성했습니다.'
  },
  community: {
    title: '고객 커뮤니티',
    goal: '프로젝트에 대한 질문과 피드백을 한곳에서 확인할 수 있게 만들었습니다.',
    work: '게시글을 질문·후기·개선 제안으로 나누고, 제목 검색과 글·댓글 작성 흐름을 만들었습니다.'
  },
  inquiry: {
    title: '문의 접수 화면',
    goal: '문의 목적에 따라 필요한 정보만 받는 화면을 기획한 예시입니다.',
    work: '문의 유형 선택, 필수 입력, 제출 결과 확인의 세 단계로 구성하는 방향을 제안합니다.'
  }
};

const dialog = document.querySelector('#project-dialog');
const content = document.querySelector('#project-content');

for (const button of document.querySelectorAll('[data-project]')) {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    const title = document.createElement('h2');
    title.id = 'project-title';
    title.textContent = project.title;
    const summary = document.createElement('p');
    summary.textContent = project.goal;
    const work = document.createElement('p');
    work.textContent = project.work;
    const link = document.createElement('a');
    link.className = 'button primary';
    link.href = './community.html?project=' + encodeURIComponent(project.title);
    link.textContent = '이 프로젝트에 질문하기';
    content.replaceChildren(title, summary, work, link);
    dialog.showModal();
  });
}
