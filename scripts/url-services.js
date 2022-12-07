import * as base from '/scripts/scripts.js';

// makes current URL match page state
export function updateURL(globals, Constants) {
  let resultURL = Constants.baseURL;
  resultURL += formArtifactsQuery(globals, Constants);
  // console.log("/" + base.thisPage().Name + resultURL);
  window.history.replaceState(null, null, '/' + base.thisPage().Name + resultURL);
}

export function formArtifactsQuery(globals, Constants) {
  let artifacts = calculateArtifacts(globals, Constants);
  let resultURL = '';
  if (artifacts.length > 0) {
    resultURL += '?';
    for (let artifact of artifacts) {
      resultURL += artifact;
      if (artifacts.indexOf(artifact) < artifacts.length - 1) {
        resultURL += '&';
      }
    }
  }
  return resultURL;
}

export function calculateArtifacts(globals, Constants) {
  let artifacts = new Array();
  if (base.thisPage().Name == '') {
    for (let category of globals.Categories) {
      if (category.IsActive) {
        artifacts.push('categories=' + category.Codename);
      }
    }
    for (let sorting of globals.Sortings) {
      if (sorting.IsActive && sorting.Codename != 'NoSort') {
        artifacts.push('sorting=' + sorting.Codename);
      }
    }
    if (globals.State.vegOnlyActive) {
      artifacts.push('vegetarian=' + 'true');
    }
    if (globals.State.currentPage != 1) {
      artifacts.push('page=' + globals.State.currentPage);
    }
  }
  return artifacts;
}

// makes page match given URL
export function applyURL(globals, Constants) {
  let query = new URL(window.location.href);
  let path = query.pathname.replace(Constants.trimSlashes, '').split('/');
  let page = path[0];

  base.setPage(page);
  let artifacts = query.search.split('&');
  // console.log(artifacts);
  if (base.thisPage() === null)
  {
    return;
  }
  else if (base.thisPage().Name === '') {
    for (let artifact of artifacts) {
      if (artifact.search('categories') >= 0) {
        globals.Categories.find((x) => x.Codename === artifact.match(Constants.queryContent).toString()).IsActive = true;
      }
      if (artifact.search('sorting') >= 0) {
        base.setSorting(artifact.match(Constants.queryContent).toString());
      }
      if (artifact.search('vegetarian') >= 0) {
        base.addVegOnly();
      }
      if (artifact.search('page') >= 0) {
        globals.State.currentPage = Number(artifact.match(Constants.queryContent).toString());
      }
    }
  }
}
