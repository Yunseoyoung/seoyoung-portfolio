const categories = { question: '프로젝트 Q&A', review: '사용 후기', suggestion: '개선 제안' };
const day = new Intl.DateTimeFormat('ko', { dateStyle: 'medium' });
const list = document.querySelector('#post-list');
const status = document.querySelector('#board-status');
const search = document.querySelector('#search');
const compose = document.querySelector('#write-dialog');
const detail = document.querySelector('#detail-dialog');
const postForm = document.querySelector('#post-form');
const commentForm = document.querySelector('#comment-form');
let posts = [];
let filter = '';
let selectedPost;
let local = location.protocol === 'file:';
let connected = local;

function element(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

async function request(path, payload) {
  if (local) return localRequest(path, payload);
  const response = await fetch('./api/posts' + path, payload ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  } : {});
  if (!response.ok) throw Error('요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return response.json();
}

function localRequest(path, payload) {
  const key = 'sy-portfolio-posts-v1';
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  if (!payload) return path ? records.find(record => '/' + record.id === path) : records;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  if (path) {
    const parent = records.find(record => '/' + record.id + '/comments' === path);
    parent.comments.push({ ...payload, id, createdAt });
  } else {
    records.unshift({ ...payload, id, createdAt, comments: [] });
  }
  localStorage.setItem(key, JSON.stringify(records));
  return path ? { id, createdAt } : records[0];
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = posts.filter(post => (!filter || post.category === filter) && post.title.toLowerCase().includes(query));
  status.textContent = visible.length ? '게시글 ' + visible.length + '개' :
    (query || filter ? '조건에 맞는 게시글이 없습니다.' : '첫 게시글을 남겨 주세요.');
  list.replaceChildren(...visible.map(post => {
    const row = element('button', '', 'post-row');
    row.type = 'button';
    row.append(element('span', categories[post.category], 'tag'), element('strong', post.title),
      element('small', post.author + ' · ' + day.format(new Date(post.createdAt))));
    row.addEventListener('click', () => showDetail(post.id));
    return row;
  }));
}

async function refresh() {
  posts = await request('');
  render();
}

async function showDetail(id) {
  try {
    const post = await request('/' + id);
    selectedPost = post.id;
    document.querySelector('#detail-category').textContent = categories[post.category];
    document.querySelector('#detail-title').textContent = post.title;
    document.querySelector('#detail-meta').textContent = [post.project, post.author, day.format(new Date(post.createdAt))].filter(Boolean).join(' · ');
    document.querySelector('#detail-body').textContent = post.body;
    const comments = post.comments.map(comment => {
      const node = element('div', '', 'comment');
      node.append(element('strong', comment.author), element('p', comment.body, 'comment-body'));
      return node;
    });
    document.querySelector('#comment-list').replaceChildren(...(comments.length ? comments : [element('p', '아직 댓글이 없습니다.', 'muted')]));
    if (!detail.open) detail.showModal();
  } catch {
    status.textContent = '게시글을 불러오지 못했습니다.';
  }
}

function handleSubmit(form, path, complete) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = form.querySelector('.form-status');
    const submit = form.querySelector('button:not([type])');
    const values = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]));
    if (!values.author || !values.body || ('title' in values && !values.title)) {
      message.textContent = '필수 항목을 입력해 주세요.';
      return;
    }
    submit.disabled = true;
    message.textContent = '';
    try {
      const result = await request(path(), values);
      form.reset();
      await complete(result);
    } catch {
      message.textContent = '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    } finally {
      submit.disabled = false;
    }
  });
}

for (const button of document.querySelectorAll('[data-close]')) {
  button.addEventListener('click', () => button.closest('dialog').close());
}
for (const button of document.querySelectorAll('[data-filter]')) {
  button.addEventListener('click', () => {
    if (!connected) return;
    filter = button.dataset.filter;
    for (const option of document.querySelectorAll('[data-filter]')) option.setAttribute('aria-pressed', String(option === button));
    render();
  });
}
search.addEventListener('input', () => { if (connected) render(); });

function openCompose() {
  if (!connected) return;
  const project = new URLSearchParams(location.search).get('project');
  if (Array.from(postForm.elements.project.options).some(option => option.value === project)) postForm.elements.project.value = project;
  compose.showModal();
}

document.querySelector('#write').addEventListener('click', openCompose);
handleSubmit(postForm, () => '', async post => {
  compose.close();
  await refresh();
  await showDetail(post.id);
});
handleSubmit(commentForm, () => '/' + selectedPost + '/comments', async () => showDetail(selectedPost));

async function start() {
  const note = document.querySelector('#storage-note');
  try {
    await refresh();
    connected = true;
    note.textContent = local ? '체험 모드입니다. 글과 댓글은 이 브라우저에만 저장됩니다.' : '글과 댓글은 게시판 방문자에게 표시됩니다.';
    if (new URLSearchParams(location.search).has('project')) openCompose();
  } catch {
    connected = false;
    note.textContent = '게시판을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';
    document.querySelector('#write').disabled = true;
  }
}

start();
