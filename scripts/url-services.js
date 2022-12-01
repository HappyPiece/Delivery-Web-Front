import * as base from "/scripts/scripts.js";

// makes current URL match page state
export function updateURL(globals, Constants) {
  let resultURL = Constants.baseURL;
  let artifacts = new Array();
  for (let category of globals.Categories) {
    if (category.IsActive) {
      artifacts.push("category=" + category.Codename);
    }
  }
  for (let sorting of globals.Sortings) {
    if (sorting.IsActive && sorting.Codename != "NoSort") {
      artifacts.push("sorting=" + sorting.Codename);
    }
  }
  if (artifacts.length > 0) {
    resultURL += "?";
    for (let artifact of artifacts) {
      resultURL += artifact;
      if (artifacts.indexOf(artifact) < artifacts.length - 1) {
        resultURL += "&";
      }
    }
  }
  window.history.replaceState(null, null, resultURL);
}

// makes page match given URL
export function applyURL(globals, Constants) {
  let query = new URL(window.location.href);
  let artifacts = query.search.split("&");
  for (let artifact of artifacts) {
    if (artifact.search("category") >= 0) {
      base.addFilter(
        globals.Categories.find(
          (x) =>
            x.Codename === artifact.match(Constants.queryContent).toString()
        ).Name
      );
    }
    if (artifact.search("sorting") >= 0) {
      // console.log(artifact.match(Constants.queryContent).toString());
      base.setSorting(artifact.match(Constants.queryContent).toString());
    }
  }
}