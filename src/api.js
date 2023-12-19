export async function request(method, path, options = {}) {
  const url = new URL("https://pro.yuketang.cn/api" + path);
  const init = {
    method: method,
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("Authorization"),
      "X-Client": "h5",
      "xtbz": "ykt",
      ...options.headers
    },
    mode: "cors",
    credentials: "include"
  };

  if (options.params) {
    for (const key in options.params) {
      url.searchParams.set(key, options.params[key]);
    }
  }

  if (options.body) {
    init.headers["Content-Type"] = "application/json; charset=utf-8";
    init.body = JSON.stringify(options.body);
  }

  const resp = await fetch(url.href, init);
  if (resp.headers.has("set-auth")) {
    localStorage.setItem("Authorization", resp.headers.get("set-auth"));
  }

  const json = await resp.json();
  return json;
}

export function answerProblem(problem, result) {
  return request("POST", "/v3/lesson/problem/answer", {
    body: {
      problemId: problem.problemId,
      problemType: problem.problemType,
      dt: Date.now(),
      result: result
    }
  });
}
