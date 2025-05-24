v
$(function () {
  "use strict";

  $(window).on("scroll", function () {
    // On scroll smooth header
    if ($(window).scrollTop() > 50) {
      $(".header-nav").addClass("header-fix");
    } else {
      $(".header-nav").removeClass("header-fix");
    }
    // On scroll auto close menu
    if ($('.navbar-collapse').hasClass('show')) {
      $('#navbar .navbar-toggler').click();
    }
  });
  // On click menu close
  $('#navbar ul li a').click(function () {
    if ($('.navbar-collapse').hasClass('show')) {
      $('#navbar .navbar-toggler').click();
    }
  });

});

// On Counter animation
$('.countdown-content>h6').each(function () {
  $(this).prop('Counter', 0).animate({
    Counter: $(this).text()
  }, {
    duration: 4000,
    easing: 'swing',
    step: function (now) {
      $(this).text(Math.ceil(now));
    }
  });
});


// Popup
$(document).ready(function () {

  $('.image-popup-vertical-fit').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    mainClass: 'mfp-img-mobile',
    image: {
      verticalFit: true
    }

  });

  $('.image-popup-fit-width').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    image: {
      verticalFit: false
    }
  });

  $('.image-popup-no-margins').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

});