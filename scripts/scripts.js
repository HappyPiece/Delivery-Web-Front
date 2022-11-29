import * as jquery from "/scripts/jquery.js";

export default class Category {
  constructor(_name, _codename, _isActive = false) {
    this.Name = _name;
    this.Codename = _codename;
    this.IsActive = _isActive;
  }
}

let Constants = {
  baseURL: "http://127.0.0.1:5500/",
  queryContent: /(?<==)\w*/g,
};

class Globals {
  constructor() {
    this.Categories = new Array(
      new Category("Wok", "Wok"),
      new Category("Пицца", "Pizza"),
      new Category("Суп", "Soup"),
      new Category("Десерт", "Dessert"),
      new Category("Напиток", "Drink")
    );

    this.State = {
      addFilterButtonPressed: false,
    };
  }
}

let globals = new Globals();

$(document).ready(function () {
  addListeners();
  applyURL();
});

function writeCategories() {
  console.log(globals.Categories);
}

function addListeners() {
  $("*").off();

  //
  $("#filter-manage-icon-container").find("span").on("click", manageFilters);

  $("#delete-filter-button").find("span").on("click", removeAllFilters);

  //
  $(".filter-element-addition")
    .find(".add-filter-icon")
    .on("click", activateFilter);

  //
  $(".filter-element-active")
    .find(".remove-filter-icon")
    .on("click", deactivateFilter);

  $("body").on("click", breakDialogs);
}

function breakDialogs() {
  //removeFilters();
}

function manageFilters() {
  if (!globals.State.addFilterButtonPressed) {
    addFilters();
  } else {
    removeFilters();
  }
}

function addFilters() {
  let _filter = retrieveTemplateById("filter-element-template");
  _filter.addClass("filter-element-addition");

  let addIcon = retrieveTemplateById("add-icon-template");
  _filter.find(".icon-container").append(addIcon);

  for (let category of globals.Categories) {
    if (!category.IsActive) {
      let filter = _filter.clone();
      filter.find(".filter-name").html(category.Name);
      $("#add-filter-button").after(filter);
    }
  }

  let removeIcon = retrieveTemplateById("remove-icon-template");
  let iconContainer = $("#filter-manage-icon-container");
  iconContainer.empty();
  iconContainer.append(removeIcon);
  globals.State.addFilterButtonPressed = true;
  addListeners();
}

function removeFilters() {
  $(".filter-element-addition").remove();

  let addIcon = retrieveTemplateById("add-icon-template");
  let iconContainer = $("#filter-manage-icon-container");
  iconContainer.empty();
  iconContainer.append(addIcon);
  globals.State.addFilterButtonPressed = false;
  addListeners();
}

function addFilter(filterName) {
  let filter = retrieveTemplateById("filter-element-template");
  filter.addClass("filter-element-active");

  let removeIcon = retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").append(removeIcon);

  filter.find(".filter-name").html(filterName);

  $("#add-filter-button").after(filter);

  globals.Categories.find(
    (x) => x.Name === filter.find(".filter-name").text()
  ).IsActive = true;

  manageFilterButtons();
  addListeners();
}

function activateFilter() {
  let filter = $(this).parents(".filter-element-addition");
  filter.removeClass("filter-element-addition");
  filter.addClass("filter-element-active");

  globals.Categories.find(
    (x) => x.Name === filter.find(".filter-name").text()
  ).IsActive = true;

  let removeIcon = retrieveTemplateById("remove-icon-template");
  filter.find(".icon-container").html(removeIcon);

  manageFilterButtons();
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

  globals.Categories.find(
    (x) => x.Name === filter.find(".filter-name").text()
  ).IsActive = false;

  manageFilterButtons();
  addListeners();
  updateURL();
}

function manageFilterButtons() {
  let allEnabled = true;
  let anyEnabled = false;

  for (let category of globals.Categories) {
    if (!category.IsActive) {
      allEnabled = false;
    } else {
      anyEnabled = true;
    }
  }

  // show add button only if there is anything to add
  if (allEnabled) {
    $("#add-filter-button").remove();
    removeFilters();
  } else if ($("#add-filter-button").length === 0) {
    let _filter = retrieveTemplateById("filter-element-template");
    _filter.attr("id", "add-filter-button");
    _filter.find(".filter-name").remove();

    let addIcon = retrieveTemplateById("add-icon-template");
    _filter.find(".icon-container").append(addIcon);
    _filter.find(".icon-container").attr("id", "filter-manage-icon-container");
    $(".filter-container").prepend(_filter);
  }

  // show remove all button only if there is anything remove
  if (!anyEnabled) {
    $("#delete-filter-button").remove();
  } else if ($("#delete-filter-button").length === 0) {
    let _filter = retrieveTemplateById("filter-element-template");
    _filter.addClass("in-the-end");
    _filter.attr("id", "delete-filter-button");
    _filter.find(".filter-name").remove();

    let addIcon = retrieveTemplateById("garbage-icon-template");
    _filter.find(".icon-container").append(addIcon);
    $(".filter-container").append(_filter);
  }
}

function removeAllFilters() {
  $(".filter-element-active").each(function () {
    if (globals.State.addFilterButtonPressed) {
      $(this).removeClass("filter-element-active");
      $(this).addClass("filter-element-addition");

      let addIcon = retrieveTemplateById("add-icon-template");
      $(this).find(".icon-container").html(addIcon);
    } else {
      $(this).remove();
    }
  });

  for (let category of globals.Categories) {
    category.IsActive = false;
  }

  manageFilterButtons();
  addListeners();
}

function retrieveTemplateById(id) {
  let template = $("#" + id).clone();
  template.removeAttr("id");
  template.removeClass("template");
  return template;
}

function updateURL() {
  let resultURL = Constants.baseURL;
  let artifacts = new Array();
  for (let category of globals.Categories) {
    if (category.IsActive) {
      artifacts.push("category=" + category.Codename);
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
  let query = new URL(window.location.href);
  let artifacts = query.search.split("&");
  for (let artifact of artifacts) {
    if (artifact.search("category") >= 0) {
      addFilter(
        globals.Categories.find(
          (x) =>
            x.Codename === artifact.match(Constants.queryContent).toString()
        ).Name
      );
    }
  }
}
