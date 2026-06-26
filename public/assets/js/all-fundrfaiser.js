let li_btn_one = document.querySelector(".li-btn-one");
let li_btn_two = document.querySelector(".li-btn-two");
let li_btn_three = document.querySelector(".li-btn-three");
let li_btn_four = document.querySelector(".li-btn-four");
let li_btn_five = document.querySelector(".li-btn-five");
let li_btn_six = document.querySelector(".li-btn-six");
let link_content_one = document.querySelector(".link-content-one");
let link_content_two = document.querySelector(".link-content-two");
let link_content_three = document.querySelector(".link-content-three");
let link_content_four = document.querySelector(".link-content-four");
let link_content_five = document.querySelector(".link-content-five");
let link_content_six = document.querySelector(".link-content-six");

li_btn_one.addEventListener("click", () => {
  link_content_one.classList.add("active-li");
  link_content_two.classList.remove("active-li");
  link_content_three.classList.remove("active-li");
  link_content_four.classList.remove("active-li");
  link_content_five.classList.remove("active-li");
  link_content_six.classList.remove("active-li");
});

li_btn_two.addEventListener("click", () => {
  link_content_one.classList.remove("active-li");
  link_content_two.classList.add("active-li");
  link_content_three.classList.remove("active-li");
  link_content_four.classList.remove("active-li");
  link_content_five.classList.remove("active-li");
  link_content_six.classList.remove("active-li");
});

li_btn_three.addEventListener("click", () => {
  link_content_one.classList.remove("active-li");
  link_content_two.classList.remove("active-li");
  link_content_three.classList.add("active-li");
  link_content_four.classList.remove("active-li");
  link_content_five.classList.remove("active-li");
  link_content_six.classList.remove("active-li");
});

li_btn_four.addEventListener("click", () => {
  link_content_one.classList.remove("active-li");
  link_content_two.classList.remove("active-li");
  link_content_three.classList.remove("active-li");
  link_content_four.classList.add("active-li");
  link_content_five.classList.remove("active-li");
  link_content_six.classList.remove("active-li");
});

li_btn_five.addEventListener("click", () => {
  link_content_one.classList.remove("active-li");
  link_content_two.classList.remove("active-li");
  link_content_three.classList.remove("active-li");
  link_content_four.classList.remove("active-li");
  link_content_five.classList.add("active-li");
  link_content_six.classList.remove("active-li");
});

li_btn_six.addEventListener("click", () => {
  link_content_one.classList.remove("active-li");
  link_content_two.classList.remove("active-li");
  link_content_three.classList.remove("active-li");
  link_content_four.classList.remove("active-li");
  link_content_five.classList.remove("active-li");
  link_content_six.classList.add("active-li");
});

