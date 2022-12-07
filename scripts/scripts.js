import * as CommonServices from "/scripts/common-services.js";
import * as UrlServices from "/scripts/url-services.js";

export default class Category {
  constructor(_name, _codename = "", _isActive = false) {
    this.Name = _name;
    this.Codename = _codename;
    this.IsActive = _isActive;
  }
}

let Constants = {
  baseURL: "",
  backendURL: "https://food-delivery.kreosoft.ru",
  queryContent: /(?<==)\w*/g,
  trimSlashes: /^\/+|\/+$/g,
};

class Globals {
  constructor() {
    this.Pages = new Array(
      new Category(""),
      new Category("registration"),
      new Category("login"),
      new Category("profile"),
      new Category("item"),
      new Category("basket"),
      new Category("orders"),
      new Category("order"),
      new Category("purchase")
    );

    this.Categories = new Array(
      new Category("Wok", "Wok"),
      new Category("Пицца", "Pizza"),
      new Category("Суп", "Soup"),
      new Category("Десерт", "Dessert"),
      new Category("Напиток", "Drink")
    );

    this.Sortings = new Array(
      new Category("По имени А-Я", "NameAsc"),
      new Category("По имени Я-А", "NameDesc"),
      new Category("По возрастанию цены", "PriceAsc"),
      new Category("По убыванию цены", "PriceDesc"),
      new Category("По возрастанию рейтинга", "RatingAsc"),
      new Category("По убыванию рейтинга", "RatingDesc"),
      new Category("Без сортировки", "NoSort", true)
    );

    this.Sexes = new Array(
      new Category("Мужчина", "Male", true),
      new Category("Женщина", "Female")
      // new Category('не указан', 'NoSex', true)
    );

    this.State = {
      categoryAdditionActive: false,
      vegOnlyActive: false,
      currentPage: 1,
      currentPagination: undefined,
      authorized: undefined,
    };

    this.Templates = null;
  }
}

let globals = new Globals();

$(document).ready(function () {
  globals.Templates = $("#templates-container");
  globals.Templates.load("/templates.html", managePage);
});

export function doDumbThings() {
  //
}

export function thisPage() {
  for (let page of globals.Pages) {
    if (page.IsActive) {
      return page;
    }
  }
  return null;
}

export function setPage(name) {
  let exists = globals.Pages.find((x) => x.Name === name);
  // console.log(exists);
  if (exists === null || exists === undefined) {
    showErrorPlug("afraid", "не на что тут смотреть", $("#main-content"));
    return;
  }
  for (let page of globals.Pages) {
    if (page.Name == name) {
      // console.log(page);
      page.IsActive = true;
    } else {
      page.IsActive = false;
    }
  }
}

export async function managePage() {
  if (globals.State.authorized === undefined) {
    await checkAuthorization();
  }

  UrlServices.applyURL(globals, Constants);
  await renderShell();
  await loadContent();
  assignListeners();
}

export async function checkAuthorization() {
  let responce = await get(Constants.backendURL + "/api/account/profile");
  if (responce.ok) {
    globals.State.authorized = true;
  } else {
    globals.State.authorized = false;
  }
}

export async function renderShell() {
  renderNavbar();

  // console.log(globals.Pages);
  if (thisPage() === null) {
    return;
  }
  $("#main-content").empty();
  switch (thisPage().Name) {
    case "": {
      // console.log("menu");
      await renderMenu();
      break;
    }
    case "registration": {
      // console.log("registration");
      if (globals.State.authorized) {
        routeTo("");
        return;
      }
      await renderRegistration();
      break;
    }
    case "login": {
      if (globals.State.authorized) {
        routeTo("");
        return;
      }
      // console.log("login");
      await renderLogin();
      break;
    }
  }
}

export async function renderNavbar() {
  $("#navbar-content").empty();
  let navbar;
  if (globals.State.authorized) {
    navbar = CommonServices.retrieveTemplateById(globals, Constants, "navbar-authorized-template");
  } else {
    navbar = CommonServices.retrieveTemplateById(globals, Constants, "navbar-unauthorized-template");
  }
  for (let page of globals.Pages) {
    if (page.IsActive) {
      switch (page.Name) {
        case "item":
        case "": {
          navbar.find("#nav-menu").attr("active", 1);
          break;
        }
        case "registration": {
          navbar.find("#nav-register").attr("active", 1);
          break;
        }
        case "login": {
          navbar.find("#nav-login").attr("active", 1);
          break;
        }
        case "purchase":
        case "basket": {
          navbar.find("#nav-basket").attr("active", 1);
          break;
        }
        case "orders":
        case "order": {
          navbar.find("#nav-orders").attr("active", 1);
          break;
        }
        case "profile": {
          navbar.find("#nav-profile").attr("active", 1);
          break;
        }
      }
    }
  }
  $("#navbar-content").append(navbar);
}

export async function renderRegistration() {
  let registrationContent = CommonServices.retrieveTemplateById(globals, Constants, "register-template");
  registrationContent.attr("id", "registration-content");

  registrationContent.find("input[type=date]").attr("min", "1900-01-01");
  registrationContent.find("input[type=date]").attr("max", getStringifiedDate());

  $("#main-content").append(registrationContent);
  manageSexes();
}

export function activateSex() {
  setSex($(this).find(".option-name").attr("id"));
  manageSexes();
}

export function setSex(sex_codename) {
  for (let sex of globals.Sexes) {
    if (sex_codename === sex.Codename) {
      sex.IsActive = true;
    } else {
      sex.IsActive = false;
    }
  }
}

export function manageSexes() {
  console.log($("#sexes-anchor").length);
  $("#sexes-anchor").find(".dropdown-content").find(".option").remove();
  let _option = CommonServices.retrieveTemplateById(globals, Constants, "dropdown-element-template");
  console.log(_option.length);
  for (let sex of globals.Sexes) {
    let option = _option.clone();
    if (sex.IsActive) {
      option.addClass("active-option");
      option.addClass("sex-dropdown-option");
      option.attr("id", "active-sex-option");
      option.find(".option-name").attr("id", sex.Codename);
      option.find(`#${sex.Codename}`).html(sex.Codename === "NoSex" ? "Не указан" : sex.Name);
      option.find(".icon-container").html(CommonServices.retrieveTemplateById(globals, Constants, "expand-more-icon-template"));
      $("#sexes-anchor").find(".dropdown-content").prepend(option);
    } else if (/*sex.Codename !== 'NoSex'*/ true) {
      option.addClass("hidden-option");
      option.addClass("sex-dropdown-option");
      option.find(".option-name").attr("id", sex.Codename);
      option.find(`#${sex.Codename}`).html(sex.Codename === "NoSex" ? "Не указан" : sex.Name);
      $("#sexes-anchor").find(".dropdown-options").append(option);
    }
  }
  assignListeners();
}

export async function renderLogin() {
  let loginContent = CommonServices.retrieveTemplateById(globals, Constants, "login-template");
  loginContent.attr("id", "login-content");
  loginContent.find("#e-mail").val("aboba@aboba.com"),
    loginContent.find("#password").val("string1g"),
    $("#main-content").append(loginContent);
}

export async function renderMenu() {
  let menuContent = CommonServices.retrieveTemplateById(globals, Constants, "menu-content-template");
  renderCategories(menuContent);

  $("#main-content").append(menuContent);
  manageSortings();
}

export function renderCategories(menuContent) {
  let categoriesAnchor = menuContent.find(".categories-anchor");
  let _category = CommonServices.retrieveTemplateById(globals, Constants, "category-element-template");

  for (let category of globals.Categories) {
    let newCategory = _category.clone();
    newCategory.attr("category", category.Codename);
    if (category.IsActive === true) {
      newCategory.attr("active", 1);
    }
    newCategory.find(".category-name").html(category.Name);

    categoriesAnchor.append(newCategory);
  }
}

export async function loadContent() {
  if (thisPage() === null) {
    return;
  }
  switch (thisPage().Name) {
    case "": {
      loadMenu();
    }
  }
}

export async function loadMenu() {
  let cardholder = $(".my-cardholder");
  let pagination = $(".pagination-container");
  pagination.empty();
  cardholder.empty();
  let responce = await fetch(Constants.backendURL + "/api/dish" + UrlServices.formArtifactsQuery(globals, Constants));
  if (responce.ok == false) {
    showErrorPlug("shruggie", "что-то пошло не так", $(".my-cardholder"));
    return;
  }

  let result = await responce.json();
  createCards(result.dishes);

  globals.State.currentPagination = result.pagination;
  globals.State.currentPage = result.pagination.current;
  managePagination();
}

export function managePagination() {
  let paginationContainer = $(".pagination-container");
  paginationContainer.empty();
  if (globals.State.currentPagination === null || globals.State.currentPagination === undefined) {
    return;
  }
  if (globals.State.currentPagination.count > 1) {
    let newPagination = CommonServices.retrieveTemplateById(globals, Constants, "pagination-template");
    newPagination.find(".to-first-page").attr("to-page", 1);
    newPagination.find(".to-last-page").attr("to-page", globals.State.currentPagination.count);
    let _toPageElement = CommonServices.retrieveTemplateById(globals, Constants, "pagination-element-page-number-template");
    for (
      let i = Math.min(Number(globals.State.currentPagination.count), Number(Number(globals.State.currentPage) + 1));
      i >= Math.max(Number(Number(globals.State.currentPage) - 1), 1);
      i--
    ) {
      // console.log(i);
      let toPageElement = _toPageElement.clone();
      toPageElement.html(i);
      toPageElement.attr("to-page", i);
      if (i == globals.State.currentPage) {
        toPageElement.attr("active", 1);
      } else {
        toPageElement.attr("active", 0);
      }
      // console.log(i);
      newPagination.find(".to-first-page").after(toPageElement);
    }
    paginationContainer.append(newPagination);
  }
  assignListeners();
}

export function createCards(dishes) {
  let _card = CommonServices.retrieveTemplateById(globals, Constants, "menu-card-template");
  let cardholder = $(".my-cardholder");
  if (dishes.length > 0) {
    for (let dish of dishes) {
      let card = _card.clone();
      card.find(".my-card-picture").attr("src", dish.image);
      if (dish.vegetarian) {
        card.find(".veg-icon-container").append(CommonServices.retrieveTemplateById(globals, Constants, "veg-icon-template"));
      }
      card.find(".my-card-name").html(dish.name);
      card.find(".my-card-category").html(globals.Categories.find((x) => x.Codename === dish.category).Name);
      let rating = card.find(".my-card-rating");
      let dishRating = dish.rating;
      for (let i = 0; i < 10; i++) {
        if (dishRating >= 1) {
          rating.append(CommonServices.retrieveTemplateById(globals, Constants, "star-icon-template"));
          dishRating -= 1;
          continue;
        } else if (dishRating >= 0.5) {
          rating.append(CommonServices.retrieveTemplateById(globals, Constants, "star-half-icon-template"));
          dishRating = 0;
          continue;
        } else {
          rating.append(CommonServices.retrieveTemplateById(globals, Constants, "star-outlined-icon-template"));
        }
      }
      card.find(".my-card-description").html(dish.description);
      card.find(".my-card-price").html(dish.price + "₽");
      cardholder.append(card);
    }
  } else {
    showErrorPlug("crying", "похоже, у нас такого нет", $(".my-cardholder"));
  }
}

export function showErrorPlug(emoji, message, target) {
  let plug = CommonServices.retrieveTemplateById(globals, Constants, "error-plug-template");
  plug.find(".error-emoji-acnhor").append(CommonServices.retrieveTemplateById(globals, Constants, emoji));
  plug.find(".error-message").html(message);
  target.append(plug);
}

// assigns ot re- assigns corresponding listeners to all the elements in the page
export function assignListeners() {
  $("*").off();

  //
  $("#veg-only-toggle").on("click", manageVegOnly);

  $("#apply-filters-bitton").on("click", applyFilters);

  $("#categories-anchor").find(".category-element-base").on("click", toggleCategory);

  // console.log($(".pagination-element-base").length);
  $(".pagination-element-base").on("click", navigateToMenuPage);

  //
  $("#sortings-anchor").find(".hidden-option").on("click", activateSorting);

  $("#sexes-anchor").find(".hidden-option").on("click", activateSex);

  $(".nav-brand").on("click", doDumbThings);

  $("#nav-menu").on("click", () => routeTo(""));
  $("#nav-register").on("click", () => routeTo("registration"));
  $("#nav-login").on("click", () => routeTo("login"));
  $("#nav-logout").on("click", () => logoutUser());
  $("#nav-profile").on("click", () => routeTo("profile"));
  $("#nav-cart").on("click", () => routeTo("cart"));
  $("#nav-orders").on("click", () => routeTo("orders"));
  $("#nav-basket").on("click", () => routeTo("basket"));

  $("#register-button").on("click", registerUser);
  $("#login-button").on("click", loginUser);
}

export async function logoutUser() {
  let responce = await post(Constants.backendURL + "/api/account/logout", {});
  localStorage.setItem("token", responce.token);
  globals.State.authorized = 0;
  routeTo("");
  managePage();
}

export async function registerUser() {
  let registerContent = $("#registration-content");
  let body = {
    fullName: registerContent.find("#e-mail").val(),
    password: registerContent.find("#password").val(),
    email: registerContent.find("#e-mail").val(),
    address: registerContent.find("#address").val(),
    birthDate: registerContent.find("#birth-date").val(),
    gender: globals.Sexes.find((x) => x.IsActive === true).Codename,
    phoneNumber: registerContent.find("#phonel").val(),
  };
  let responce = await post(Constants.backendURL + "/api/account/register", body);
  if (responce.ok === true) {
    let data = await responce.json();
    localStorage.setItem("token", data.token);
    globals.State.authorized = true;
    routeTo("");
    managePage();
  }
}

export async function loginUser() {
  let loginContent = $("#login-content");
  let body = {
    email: loginContent.find("#e-mail").val(),
    password: loginContent.find("#password").val(),
  };
  let responce = await post(Constants.backendURL + "/api/account/login", body);
  console.log(responce);
  if (responce.ok === true) {
    let data = await responce.json();
    localStorage.setItem("token", data.token);
    globals.State.authorized = true;
    routeTo("");
    managePage();
  }
}

export async function get(url) {
  let responce = await fetch(url, {
    headers: new Headers({
      "Authorization": "Bearer " + localStorage.getItem("token"),
    }),
  });
  return responce;
}

export async function post(url, body) {
  let responce = await fetch(url, {
    method: "Post",
    body: JSON.stringify(body),
    headers: new Headers({
      "Authorization": "Bearer " + localStorage.getItem("token"),
      "Content-Type": "application/json",
    }),
  });
  return responce;
}

export function routeTo(name) {
  setPage(name);
  UrlServices.updateURL(globals, Constants);
  managePage();
}

export function toggleCategory() {
  if (Number($(this).attr("active")) === 0) {
    setCategory($(this).attr("category"), true);
    $(this).attr("active", 1);
  } else {
    setCategory($(this).attr("category"), false);
    $(this).attr("active", 0);
  }
}

export function setCategory(codename, state) {
  globals.Categories.find((x) => x.Codename === codename).IsActive = state;
}

export function navigateToMenuPage() {
  globals.State.currentPage = $(this).attr("to-page");
  UrlServices.updateURL(globals, Constants);
  loadContent();
  $(this).attr("to-page");
}

export function applyFilters() {
  globals.State.currentPage = 1;
  UrlServices.updateURL(globals, Constants);
  loadMenu();
}

export function manageVegOnly() {
  if (!globals.State.vegOnlyActive) {
    addVegOnly();
  } else {
    removeVegOnly();
  }
}

export function addVegOnly() {
  globals.State.vegOnlyActive = true;
  $("#veg-only-toggle").attr("active", 1);
  // UrlServices.updateURL(globals, Constants);
}

export function removeVegOnly() {
  globals.State.vegOnlyActive = false;
  $("#veg-only-toggle").attr("active", 0);
  // UrlServices.updateURL(globals, Constants);
}

// adds or removes inactive filters, corresponding to current state of add button, to which it listens
export function toggleCategories() {
  if (!globals.State.categoryAdditionActive) {
    globals.State.categoryAdditionActive = true;
  } else {
    globals.State.categoryAdditionActive = false;
  }
  manageCategories();
}

export function manageCategories() {
  if (globals.State.categoryAdditionActive) {
    showCategories();
  } else {
    hideCategories();
  }
}

// activating sorting
export function activateSorting() {
  setSorting($(this).find(".option-name").attr("id"));
  manageSortings();
}

export function setSorting(sorting_codename) {
  for (let sorting of globals.Sortings) {
    if (sorting_codename === sorting.Codename) {
      sorting.IsActive = true;
    } else {
      sorting.IsActive = false;
    }
  }
}

export function manageSortings() {
  $("#sortings-anchor").find(".dropdown-content").find(".option").remove();
  let _option = CommonServices.retrieveTemplateById(globals, Constants, "dropdown-element-template");
  for (let sorting of globals.Sortings) {
    let option = _option.clone();
    if (sorting.IsActive) {
      option.addClass("active-option");
      option.attr("id", "active-sorting-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option.find(`#${sorting.Codename}`).html(sorting.Codename === "NoSort" ? "Сортировать по" : sorting.Name);
      option.find(".icon-container").html(CommonServices.retrieveTemplateById(globals, Constants, "expand-more-icon-template"));
      $("#sortings-anchor").find(".dropdown-content").prepend(option);
    } else {
      option.addClass("hidden-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option.find(`#${sorting.Codename}`).html(sorting.Codename === "NoSort" ? "Без сортировки" : sorting.Name);
      $("#sortings-anchor").find(".dropdown-options").append(option);
    }
  }
  assignListeners();
}

export function getStringifiedDate() {
  let currentDate = new Date();
  let dd = String(currentDate.getDate()).padStart(2, "0");
  let mm = String(currentDate.getMonth() + 1).padStart(2, "0");
  let yyyy = currentDate.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}
