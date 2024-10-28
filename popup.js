function getBilibiliSubtitle(url) {
  const apiUrl = 'https://www.kedou.life/api/video/subtitleExtract';
  
  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
    },
    body: JSON.stringify({ url: url }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.data && data.data.subtitleItemVoList && data.data.subtitleItemVoList.length > 0) {
      const subtitles = data.data.subtitleItemVoList[0].content;
      if (!subtitles) {
        return "该视频没有字幕。";
      }
      
      const newSubtitles = subtitles.split('\n\n')
        .map(subTitle => subTitle.split('\n').pop())
        .join('\n');
      
      return newSubtitles;
    } else {
      return "无法获取字幕信息。";
    }
  })
  .catch(error => {
    return "获取字幕时出错: " + error.message;
  });
}

function getSummary(subtitles) {
  const summaryApiUrl = 'http://10.100.4.33:7002/summary';
  
  return fetch(summaryApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: subtitles }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.summary) {
      return data.summary;
    } else {
      return "无法生成总结。";
    }
  })
  .catch(error => {
    return "生成总结时出错: " + error.message;
  });
}

function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("result").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("result").style.display = "block";
}

function displayResult(result) {
  document.getElementById("result").innerHTML = marked.parse(result);
  hideLoading();
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  var currentTab = tabs[0];
  var url = currentTab.url;
  
  if (url.includes("bilibili.com")) {
    document.getElementById("url").textContent = url;
    showLoading();
    getBilibiliSubtitle(url)
      .then(subtitles => {
        if (subtitles === "该视频没有字幕。" || subtitles === "无法获取字幕信息。") {
          throw new Error(subtitles);
        }
        return getSummary(subtitles);
      })
      .then(summary => {
        displayResult(summary);
      })
      .catch(error => {
        hideLoading();
        document.getElementById("result").textContent = error.message;
      });
  } else {
    document.getElementById("url").textContent = "这不是一个B站页面";
    document.getElementById("result").textContent = "";
  }
});
