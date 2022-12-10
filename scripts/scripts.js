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
  backendURL: "https://food-delivery.kreosoft.ru",
  queryContent: /(?<==)\w*/g,
  trimSlashes: /^\/+|\/+$/g,
  phoneRegex: new RegExp(/^\+7 \([0-9]{3}\) ([0-9]{3})-([0-9]{2})-([0-9]{2})$/),
  emailRegex: new RegExp(
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/
  ),
};

class Globals {
  constructor() {
    this.Pages = new Array(
      new Category(""),
      new Category("registration"),
      new Category("login"),
      new Category("profile"),
      new Category("item"),
      new Category("cart"),
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
      // new Category("Биба и боба", "Pizza")
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
      currentDish: undefined,
    };

    this.Templates = null;
  }
}

let globals = new Globals();

$(document).ready(function () {
  globals.Templates = $("#templates-container").clone();
  globals.Templates.load("/templates.html", async () => {
    await managePage();
  });

  //doDumbThings();
});

export async function doDumbThings() {
  console.log(globals.State.currentDish);
}

export function thisPage() {
  for (let page of globals.Pages) {
    if (page.IsActive) {
      return page;
    }
  }
  return null;
}

export async function setPage(name) {
  let exists = globals.Pages.find((x) => x.Name === name);
  if (exists === null || exists === undefined) {
    showErrorPlug("afraid", "не на что тут смотреть", $("#main-content"));
    return;
  }
  for (let page of globals.Pages) {
    if (page.Name == name) {
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
  await UrlServices.applyURL(globals, Constants);
  await renderShell();
  await loadContent();
  assignListeners();

  await applyMasks();
  await showContent();
}

export async function showContent() {
  $("#main-content").attr("ready", "1");
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
  await renderNavbar();
  $("#main-content").empty();
  if (thisPage() === null) {
    return;
  }

  switch (thisPage().Name) {
    case "": {
      // console.log("menu");
      await renderMenu();
      break;
    }
    case "registration": {
      if (globals.State.authorized) {
        await routeTo("");
        return;
      }
      await renderRegistration();
      break;
    }
    case "login": {
      if (globals.State.authorized) {
        await routeTo("");
        return;
      }
      await renderLogin();
      break;
    }
    case "profile": {
      if (!globals.State.authorized) {
        await routeTo("login");
        return;
      }
      await renderProfile();
      break;
    }
    case "item": {
      await renderDish();
      break;
    }
    case "cart": {
      await renderCart();
      break;
    }
  }
}

export async function renderCart() {
  let cartContent = CommonServices.retrieveTemplateById(globals, Constants, "cart-template");
  cartContent.attr("id", "cart-content");
  $("#main-content").append(cartContent);
}

export async function renderDish() {
  let dishContent = CommonServices.retrieveTemplateById(globals, Constants, "dish-template");
  dishContent.attr("id", "dish-content");
  $("#main-content").append(dishContent);
}

export async function renderProfile() {
  let profileContent = CommonServices.retrieveTemplateById(globals, Constants, "profile-template");
  profileContent.attr("id", "profile-content");

  profileContent.find("input[type=date]").attr("min", "1900-01-01");
  profileContent.find("input[type=date]").attr("max", getStringifiedDate());

  $("#main-content").append(profileContent);
}

export async function applyMasks() {
  $("#reg-phone").inputmask("+7 (999) 999-99-99");
  $("#profile-phone").inputmask("+7 (999) 999-99-99");
}

export async function renderNavbar() {
  $("#navbar-content").empty();
  let navbar;
  if (globals.State.authorized) {
    navbar = CommonServices.retrieveTemplateById(globals, Constants, "navbar-authorized-template");
    let responce = await get(Constants.backendURL + "/api/account/profile");
    if (responce.ok !== true) {
      routeTo("login");
    }
    let userProfile = await responce.json();
    navbar.find("#navbar-main-e-mail").html(userProfile.email);
    navbar.find("#navbar-hidden-e-mail").html(userProfile.email);
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
        case "cart": {
          navbar.find("#nav-cart").attr("active", 1);
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

  manageSexes(registrationContent.find("#reg-sexes-anchor"));
  $("#main-content").append(registrationContent);
}

export async function renderLogin() {
  let loginContent = CommonServices.retrieveTemplateById(globals, Constants, "login-template");
  loginContent.attr("id", "login-content");
  loginContent.find("#login-e-mail").val("aboba@aboba.com"),
    loginContent.find("#login-password").val("string1g"),
    $("#main-content").append(loginContent);
}

export async function renderMenu() {
  let menuContent = CommonServices.retrieveTemplateById(globals, Constants, "menu-content-template");
  menuContent.attr("id", "menu-content");
  await renderCategories(menuContent);
  await manageSortings(menuContent);
  await manageVegOnly(menuContent);
  $("#main-content").append(menuContent);
}

export async function renderCategories(menuContent) {
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
      await loadMenu();
      break;
    }
    case "profile": {
      await loadProfile();
      break;
    }
    case "item": {
      await loadDish();
      break;
    }
    case "cart": {
      await loadCart();
      break;
    }
  }
}

export async function loadCart() {
  let cartContent = $("#cart-content");
  let responce = await get(Constants.backendURL + "/api/basket");
  if (responce.ok === false) {
    if (responce.status === 401) {
      routeTo("login");
    }
    return;
  }
  let items = await responce.json();

  createCartItems(items, cartContent.find(".cart-items"));
  console.log();
}

export function createCartItems(items, itemsContainer) {
  let _item = CommonServices.retrieveTemplateById(globals, Constants, "cart-item-template");
  itemsContainer.empty();
  if (items.length === 0) {
    console.log(cartContent.find(".cart-items").length);
    showErrorPlug("crying", "Корзина пуста. Возможно, самое время добавить в нее что-нибудь", cartContent.find(".cart-items"));
  } else {
    let i = 1;
    for (let item of items) {
      let newItem = _item.clone();

      newItem.find(".cart-item-number").html(i + ".");
      newItem.find(".cart-item-picture").attr("src", item.image);
      newItem.find(".cart-item-name").html(item.name);
      newItem.find(".cart-item-name").attr("to-dish", item.id);
      newItem.find(".cart-item-price").html("Цена/шт: " + item.price + "₽");
      itemsContainer.append(newItem);
    }
  }
}

export async function loadDish() {
  let dishContent = $("#dish-content");
  let responce = await get(Constants.backendURL + "/api/dish/" + globals.State.currentDish);
  if (responce.ok === false) {
    if (responce.status === 404) {
      showErrorPlug("bribe", "видимо, такого блюда у нас нет", $("#main-content"));
    }
    return;
  }
  let dish = await responce.json();

  dishContent.find(".dish-picture").attr("src", dish.image);
  dishContent.find(".dish-vegeterian").html(dish.vegetarian ? "Вегетерианское" : "Не вегетерианское");
  dishContent.find(".dish-vegeterian").attr("true", dish.vegetarian ? "1" : "0");
  dishContent.find(".dish-title").html(dish.name);
  dishContent.find(".dish-category").html("Категория - " + globals.Categories.find((x) => x.Codename === dish.category).Name);
  let rating = dishContent.find(".dish-rating");
  let dishRating = dish.rating;
  for (let i = 0; i < 10; i++) {
    if (dishRating >= 1) {
      let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-icon-template");
      icon.addClass("dish-rating-icon");
      rating.append(icon);
      dishRating -= 1;
      continue;
    } else if (dishRating >= 0.5) {
      let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-half-icon-template");
      icon.addClass("dish-rating-icon");
      rating.append(icon);
      dishRating = 0;
      continue;
    } else {
      let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-outlined-icon-template");
      icon.addClass("dish-rating-icon");
      rating.append(icon);
    }
  }
  dishContent.find(".dish-description").html(dish.description);
  dishContent.find(".dish-price").html(dish.price + "₽");
}

export async function loadProfile() {
  let profileContent = $("#profile-content");

  let responce = await get(Constants.backendURL + "/api/account/profile");
  if (responce.ok === false) {
    if (responce.status === 401) {
      routeTo("login");
    }
    showErrorPlug("shruggie", "что-то пошло не так", $("#main-content"));
    return;
  }

  let result = await responce.json();
  console.log(result);
  profileContent.find("#profile-full-name").val(result.fullName);
  profileContent.find("#profile-e-mail").val(result.email);
  profileContent.find("#profile-address").val(result.address);
  profileContent.find("#profile-birthdate").val(purgeDate(result.birthDate));
  profileContent.find("#profile-sex").val(globals.Sexes.find((x) => x.Codename === result.gender).Name);
  profileContent.find("#profile-phone").val(result.phoneNumber);
}

export async function loadMenu() {
  let cardholder = $(".my-cardholder");
  let pagination = $(".pagination-container");
  let responce = await get(Constants.backendURL + "/api/dish" + UrlServices.formArtifactsQuery(globals, Constants));
  if (responce.ok == false) {
    showErrorPlug("shruggie", "что-то пошло не так", $(".my-cardholder"));
    return;
  }

  let result = await responce.json();
  createCards(result.dishes, cardholder);

  globals.State.currentPagination = result.pagination;
  globals.State.currentPage = result.pagination.current;
  managePagination(pagination);
}

export function managePagination(paginationContainer) {
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
      let toPageElement = _toPageElement.clone();
      toPageElement.html(i);
      toPageElement.attr("to-page", i);
      if (i == globals.State.currentPage) {
        toPageElement.attr("active", 1);
      } else {
        toPageElement.attr("active", 0);
      }
      newPagination.find(".to-first-page").after(toPageElement);
    }
    paginationContainer.append(newPagination);
  }
  assignListeners();
}

export function createCards(dishes, cardholder) {
  let _card = CommonServices.retrieveTemplateById(globals, Constants, "menu-card-template");
  cardholder.empty();
  if (dishes.length > 0) {
    for (let dish of dishes) {
      let card = _card.clone();
      card.find(".my-card-picture").attr("src", dish.image);
      if (dish.vegetarian) {
        card.find(".veg-icon-container").append(CommonServices.retrieveTemplateById(globals, Constants, "veg-icon-template"));
      }
      card.find(".my-card-name").html(dish.name);
      card.find(".my-card-name").attr("to-dish", dish.id);
      card.find(".my-card-category").html(globals.Categories.find((x) => x.Codename === dish.category).Name);
      let rating = card.find(".my-card-rating");
      let dishRating = dish.rating;
      for (let i = 0; i < 10; i++) {
        if (dishRating >= 1) {
          let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-icon-template");
          icon.addClass("my-card-rating-icon");
          rating.append(icon);
          dishRating -= 1;
          continue;
        } else if (dishRating >= 0.5) {
          let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-half-icon-template");
          icon.addClass("my-card-rating-icon");
          rating.append(icon);
          dishRating = 0;
          continue;
        } else {
          let icon = CommonServices.retrieveTemplateById(globals, Constants, "star-outlined-icon-template");
          icon.addClass("my-card-rating-icon");
          rating.append(icon);
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
  target.empty();
  let plug = CommonServices.retrieveTemplateById(globals, Constants, "error-plug-template");
  plug.find(".error-emoji-acnhor").append(CommonServices.retrieveTemplateById(globals, Constants, emoji));
  plug.find(".error-message").html(message);
  target.append(plug);
}

// assigns ot re- assigns corresponding listeners to all the elements in the page
export async function assignListeners() {
  $("*").off();

  //
  $("#veg-only-toggle").on("click", async () => {
    await toggleVegOnly($("#menu-content"));
  });

  $("#apply-filters-bitton").on("click", applyFilters);

  $("#categories-anchor").find(".category-element-base").on("click", toggleCategory);

  // console.log($(".pagination-element-base").length);
  $(".pagination-element-base").on("click", navigateToMenuPage);
  $(".my-card-name").on("click", navigateToDish);
  $(".cart-item-name").on("click", navigateToDish);
  

  //
  $("#sortings-anchor").find(".hidden-option").on("click", activateSorting);

  $("#reg-sexes-anchor").find(".hidden-option").on("click", activateSex);

  $(".nav-brand").on("click", doDumbThings);

  $("#nav-menu").on("click", () => routeTo(""));
  $("#nav-register").on("click", () => routeTo("registration"));
  $("#nav-login").on("click", () => routeTo("login"));
  $("#nav-logout").on("click", () => logoutUser());
  $("#nav-profile").on("click", () => routeTo("profile"));
  $("#nav-cart").on("click", () => routeTo("cart"));
  $("#nav-orders").on("click", () => routeTo("orders"));

  $("#register-button").on("click", registerUser);
  $("#login-button").on("click", loginUser);
  $("#save-profile-button").on("click", alterProfile);

  applyMasks();
}
export async function navigateToDish() {
  globals.State.currentDish = $(this).attr("to-dish");
  routeTo("item");
}

export async function alterProfile() {
  let profileContent = $("#profile-content");
  let body = {
    fullName: profileContent.find("#profile-full-name").val(),
    address: profileContent.find("#profile-address").val(),
    birthDate: registerContent.find("#profile-birthdate").val() !== "" ? registerContent.find("#profile-birthdate").val() : null,
    gender: globals.Sexes.find((x) => x.Name === profileContent.find("#profile-sex").val()).Codename,
    phoneNumber: profileContent.find("#profile-phone").val() !== "" ? profileContent.find("#profile-phone").val() : null,
  };
  // console.log(body.phoneNumber);
  let validationResult = await validateProfile(body);
  console.log(validationResult);
  if (!validationResult.ok) {
    await showMessages(validationResult.messages, $("#profile-message-container"), "bad");
    return;
  }

  let responce = await put(Constants.backendURL + "/api/account/profile", body);
  console.log(responce);
  if (responce.ok !== true) {
    if (responce.status === 401) {
      routeTo("login");
    } else if (responce.status === 500) {
      showErrorPlug("shruggie", "что-то пошло не так, вините бекенд", $("#main-content"));
    } else if (responce.status === 400) {
      let data = await responce.json();
      console.log(data);
      await showMessages(data.errors, $("#profile-message-container"), "bad");
    }
  } else {
    await showMessages({ Success: new Array("Профиль успешно изменен") }, $("#profile-message-container"), "good");
  }
}

export async function validateProfile(data) {
  let result = new ValidationResult();
  if (data.fullName.length < 1) {
    result.ok = false;
    result.messages.errors.push("Поле 'ФИО' является обязательным");
  }
  if (!(await validatePhone(data.phoneNumber))) {
    result.ok = false;
    result.messages.errors.push("Номер телефона введен неверно");
  }
  if (!(await validateBirthdate(data.birthDate))) {
    result.ok = false;
    result.messages.errors.push("Автору ноль лет");
  }
  return result;
}

export async function showMessages(messages, container, type) {
  container.empty();
  let _message = CommonServices.retrieveTemplateById(globals, Constants, "message-base-template");
  for (let message in messages) {
    if (Object.prototype.hasOwnProperty.call(messages, message)) {
      console.log(messages[message]);
      for (let prompt of messages[message]) {
        let message = _message.clone();
        message.attr("type", type);
        message.find(".message-content").html(prompt);
        container.append(message);
      }
    }
  }
}

export async function logoutUser() {
  let responce = await post(Constants.backendURL + "/api/account/logout", {});
  localStorage.setItem("token", responce.token);
  globals.State.authorized = 0;
  await routeTo("");
  await managePage();
}

export async function registerUser() {
  let registerContent = $("#registration-content");
  let body = {
    fullName: registerContent.find("#reg-full-name").val(),
    password: registerContent.find("#reg-password").val(),
    email: registerContent.find("#reg-e-mail").val(),
    address: registerContent.find("#reg-address").val(),
    birthDate: registerContent.find("#reg-birthdate").val() !== "" ? registerContent.find("#reg-birthdate").val() : null,
    gender: globals.Sexes.find((x) => x.IsActive === true).Codename,
    phoneNumber: registerContent.find("#reg-phone").val() !== "" ? registerContent.find("#reg-phone").val() : null,
  };
  console.log(body.email);
  let validationResult = await validateRegistration(body);
  console.log(validationResult);
  if (!validationResult.ok) {
    await showMessages(validationResult.messages, $("#reg-message-container"), "bad");
    return;
  }

  let responce = await post(Constants.backendURL + "/api/account/register", body);
  if (responce.ok === true) {
    let data = await responce.json();
    localStorage.setItem("token", data.token);
    globals.State.authorized = true;
    await routeTo("");
  }
}

export async function validateRegistration(data) {
  let result = new ValidationResult();
  if (data.fullName.length < 1) {
    result.ok = false;
    result.messages.errors.push("Поле 'ФИО' является обязательным");
  }
  if (!(await validatePhone(data.phoneNumber)) && data.phoneNumber !== null) {
    result.ok = false;
    result.messages.errors.push("Номер телефона введен неверно");
  }
  if (!(await validateBirthdate(data.birthDate)) && data.birthDate !== null) {
    result.ok = false;
    result.messages.errors.push("Автору ноль лет");
  }
  if (!(await validateEmail(data.email))) {
    result.ok = false;
    result.messages.errors.push("Email введен неверно");
  }
  if (data.password.length < 6) {
    result.ok = false;
    result.messages.errors.push("Длина пароля минимум 6 символов");
  }
  return result;
}

export async function validateBirthdate(birthdate) {
  let currentDate = new Date();
  let minDate = new Date("1900-01-01");
  let userBirthDate = new Date(birthdate);
  console.log(minDate < userBirthDate && userBirthDate < currentDate);
  return minDate < userBirthDate && userBirthDate < currentDate;
}

export async function validatePhone(phoneNumber) {
  return Constants.phoneRegex.test(phoneNumber);
}

export async function validateEmail(email) {
  return Constants.emailRegex.test(email);
}

class ValidationResult {
  constructor(_ok = true, _messages = { errors: new Array() }) {
    this.ok = _ok;
    this.messages = _messages;
  }
}

export async function loginUser() {
  let loginContent = $("#login-content");
  let body = {
    email: loginContent.find("#login-e-mail").val(),
    password: loginContent.find("#login-password").val(),
  };
  let responce = await post(Constants.backendURL + "/api/account/login", body);
  console.log(responce);
  if (responce.ok === true) {
    let data = await responce.json();
    localStorage.setItem("token", data.token);
    globals.State.authorized = true;
    await routeTo("");
  } else if (responce.status === 400) {
    let data = await responce.json();
    console.log(data);
    await showMessages({ Error: new Array("Неверный логин или пароль") }, $("#login-message-container"), "bad");
  } else if (responce.status === 500) {
    showErrorPlug("shruggie", "что-то пошло не так, вините бекенд", $("#main-content"));
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

export async function put(url, body) {
  let responce = await fetch(url, {
    method: "Put",
    body: JSON.stringify(body),
    headers: new Headers({
      "Authorization": "Bearer " + localStorage.getItem("token"),
      "Content-Type": "application/json",
    }),
  });
  return responce;
}

export async function routeTo(name) {
  await setPage(name);
  UrlServices.updateURL(globals, Constants);
  await managePage();
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
  console.log("navigating");
  loadContent();
  $(this).attr("to-page");
}

export function applyFilters() {
  globals.State.currentPage = 1;
  UrlServices.updateURL(globals, Constants);
  console.log("applying filters");
  loadContent();
}

export async function manageVegOnly(menuContent) {
  if (globals.State.vegOnlyActive) {
    menuContent.find("#veg-only-toggle").attr("active", 1);
  } else {
    menuContent.find("#veg-only-toggle").attr("active", 0);
  }
}

export async function toggleVegOnly(menuContent) {
  if (!globals.State.vegOnlyActive) {
    await addVegOnly();
  } else {
    await removeVegOnly();
  }
  await manageVegOnly(menuContent);
}

export async function addVegOnly() {
  globals.State.vegOnlyActive = true;
}

export async function removeVegOnly() {
  globals.State.vegOnlyActive = false;
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
export async function activateSorting() {
  await setSorting($(this).find(".option-name").attr("id"));
  manageSortings($("#menu-content"));
}

export async function setSorting(sorting_codename) {
  if (
    globals.Sortings.find((x) => x.Codename === sorting_codename) === null ||
    globals.Sortings.find((x) => x.Codename === sorting_codename) === undefined
  ) {
    return;
  }
  for (let sorting of globals.Sortings) {
    if (sorting_codename === sorting.Codename) {
      sorting.IsActive = true;
    } else {
      sorting.IsActive = false;
    }
  }
}

export async function manageSortings(menuContent) {
  menuContent.find("#sortings-anchor").find(".dropdown-content").find(".option").remove();
  let _option = CommonServices.retrieveTemplateById(globals, Constants, "dropdown-element-template");
  for (let sorting of globals.Sortings) {
    let option = _option.clone();
    if (sorting.IsActive) {
      option.addClass("active-option");
      option.attr("id", "active-sorting-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option.find(`#${sorting.Codename}`).html(sorting.Codename === "NoSort" ? "Сортировать по" : sorting.Name);
      option.find(".icon-container").html(CommonServices.retrieveTemplateById(globals, Constants, "expand-more-icon-template"));
      menuContent.find("#sortings-anchor").find(".dropdown-content").prepend(option);
    } else {
      option.addClass("hidden-option");
      option.find(".option-name").attr("id", sorting.Codename);
      option.find(`#${sorting.Codename}`).html(sorting.Codename === "NoSort" ? "Без сортировки" : sorting.Name);
      menuContent.find("#sortings-anchor").find(".dropdown-options").append(option);
    }
  }
  assignListeners();
}

export function activateSex() {
  setSex($(this).find(".option-name").attr("id"));
  manageSexes($(this).parents(".sex-dropdown-anchor"));
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

export function manageSexes(sexesAnchor) {
  sexesAnchor.find(".dropdown-content").find(".option").remove();
  let _option = CommonServices.retrieveTemplateById(globals, Constants, "dropdown-element-template");
  for (let sex of globals.Sexes) {
    let option = _option.clone();
    if (sex.IsActive) {
      option.addClass("active-option");
      option.addClass("sex-dropdown-option");
      option.attr("id", "active-sex-option");
      option.find(".option-name").attr("id", sex.Codename);
      option.find(`#${sex.Codename}`).html(sex.Codename === "NoSex" ? "Не указан" : sex.Name);
      option.find(".icon-container").html(CommonServices.retrieveTemplateById(globals, Constants, "expand-more-icon-template"));
      sexesAnchor.find(".dropdown-content").prepend(option);
    } else if (/*sex.Codename !== 'NoSex'*/ true) {
      option.addClass("hidden-option");
      option.addClass("sex-dropdown-option");
      option.find(".option-name").attr("id", sex.Codename);
      option.find(`#${sex.Codename}`).html(sex.Codename === "NoSex" ? "Не указан" : sex.Name);
      sexesAnchor.find(".dropdown-options").append(option);
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

export function purgeDate(date) {
  let theDate = new Date(date);
  let dd = String(theDate.getDate()).padStart(2, "0");
  let mm = String(theDate.getMonth() + 1).padStart(2, "0");
  let yyyy = theDate.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}
