class Globals {
  constructor() {
    this.Categories = new Map([
      ["Wok", false],
      ["Пицца", false],
      ["Суп", false],
      ["Десерт", false],
      ["Напиток", false],
    ]);

    this.State = {
      addFilterButtonPressed: false,
      baseURL: "http://127.0.0.1:5500/",
    };
  }
}

let globals = new Globals();

$(document).ready(function () {
  addListeners();
});

function writeCategories() {
  console.log(globals.Categories);
}

function addListeners() {
  $("*").off();

  //
  $("#filter-manage-icon-container").find("span").on("click", addFilters);

  //
  $(".filter-element-addition")
    .find(".add-filter-icon")
    .on("click", activateFilter);

  //
  $(".filter-element-active")
    .find(".remove-filter-icon")
    .on("click", deactivateFilter);
}

function addFilters() {
  if (!globals.State.addFilterButtonPressed) {
    let _filter = retrieveTemplateById("filter-element-template");
    _filter.addClass("filter-element-addition");

    let addIcon = retrieveTemplateById("add-icon-template");
    _filter.find(".icon-container").append(addIcon);

    for (let [category, isActive] of globals.Categories.entries()) {
      let filter = _filter.clone();
      if (!isActive) {
        filter.find(".filter-name").html(category);
        $(this).parents("#add-filter-button").after(filter);
      }
    }

    let removeIcon = retrieveTemplateById("remove-icon-template");
    let iconContainer = $(this).parent();
    $(this).remove();
    iconContainer.append(removeIcon);
    globals.State.addFilterButtonPressed = true;
  } else {
    $(".filter-element-addition").remove();

    let addIcon = retrieveTemplateById("add-icon-template");
    let iconContainer = $(this).parent();
    $(this).remove();
    iconContainer.append(addIcon);
    globals.State.addFilterButtonPressed = false;
  }

  addListeners();
}

function addFilter(filterName) {
  let filter = retrieveTemplateById("filter-element-template");
  filter.addClass("filter-element-active");

  let removeIcon = retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").append(removeIcon);

  filter.find(".filter-name").html(filterName);

  $("#add-filter-button").after(filter);

  globals.Categories.set(filter.find(".filter-name").text(), true); 

  addListeners();
}

function activateFilter() {
  let filter = $(this).parents(".filter-element-addition");
  filter.removeClass("filter-element-addition");
  filter.addClass("filter-element-active");

  globals.Categories.set(filter.find(".filter-name").text(), true);

  let removeIcon = retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").html(removeIcon);

  addListeners();
  updateURL();
}

function deactivateFilter() {
  let filter = $(this).parents(".filter-element-active");

  if (globals.State.addFilterButtonPressed) {
    filter.removeClass("filter-element-active");
    filter.addClass("filter-element-addition");

    let addIcon = retrieveTemplateById("add-icon-template");
    filter.find(".icon-container").html(addIcon);
  } else {
    $(this).parents(".filter-element-active").remove();
  }

  globals.Categories.set(filter.find(".filter-name").text(), false);
  addListeners();
  updateURL();
}

function retrieveTemplateById(id) {
  let template = $("#" + id).clone();
  template.removeAttr("id");
  template.removeClass("template");
  return template;
}

function updateURL() {
  let resultURL = globals.State.baseURL;
  let artifacts = new Array();
  for (let [category, isActive] of globals.Categories.entries()) {
    if (isActive) {
      artifacts.push("category=" + category);
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

function applyURL() {
  let URL = new URL(window.location.href);
  
}
