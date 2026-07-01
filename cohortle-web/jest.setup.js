// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock isomorphic-dompurify for Jest
jest.mock('isomorphic-dompurify', () => {
  return {
    __esModule: true,
    default: {
      sanitize: (html, config) => {
        // Simple mock that removes script tags for testing
        if (!html) return '';
        return html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/javascript:/gi, '');
      },
    },
  };
});

// Mock @phosphor-icons/react (ESM-only package, not transformable by next/jest)
jest.mock('@phosphor-icons/react', () => {
  const React = require('react');
  function IconStub(props) {
    return React.createElement('svg', {
      'data-testid': 'phosphor-icon',
      'data-weight': props.weight,
      width: props.size,
      height: props.size,
      className: props.className,
    });
  }
  return {
    CheckCircle: IconStub, Circle: IconStub, LockSimple: IconStub, Fire: IconStub,
    Trophy: IconStub, Star: IconStub, BookOpen: IconStub, Users: IconStub,
    Lightning: IconStub, CalendarCheck: IconStub, Medal: IconStub, Target: IconStub,
    TrendUp: IconStub, Lightbulb: IconStub, MapTrifold: IconStub, Student: IconStub,
    Flag: IconStub, ArrowLeft: IconStub, ArrowRight: IconStub, X: IconStub,
    Check: IconStub, Warning: IconStub, Info: IconStub, Question: IconStub,
    Lock: IconStub, Unlock: IconStub, Play: IconStub, Pause: IconStub,
    FileText: IconStub, Link: IconStub, Video: IconStub, Image: IconStub,
    Download: IconStub, Upload: IconStub, Gear: IconStub, User: IconStub,
    SignOut: IconStub, House: IconStub, MagnifyingGlass: IconStub, Bell: IconStub,
    Chat: IconStub, Heart: IconStub, ThumbsUp: IconStub, ThumbsDown: IconStub,
    Share: IconStub, Copy: IconStub, Trash: IconStub, PencilSimple: IconStub,
    Plus: IconStub, Minus: IconStub, CaretDown: IconStub, CaretUp: IconStub,
    CaretLeft: IconStub, CaretRight: IconStub, DotsThree: IconStub,
    DotsThreeVertical: IconStub, Spinner: IconStub, CircleNotch: IconStub,
  };
});

// Mock framer-motion to avoid issues with motion components in Jest
jest.mock('framer-motion', () => {
  const React = require('react');
  function createMotionComponent(tag) {
    return React.forwardRef(function MotionComponent(props, ref) {
      // eslint-disable-next-line no-unused-vars
      const { animate, initial, exit, whileHover, whileTap, transition, layout, layoutId, variants, ...rest } = props;
      return React.createElement(tag, Object.assign({}, rest, { ref }));
    });
  }
  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      a: createMotionComponent('a'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      nav: createMotionComponent('nav'),
      main: createMotionComponent('main'),
      aside: createMotionComponent('aside'),
      circle: createMotionComponent('circle'),
      path: createMotionComponent('path'),
      svg: createMotionComponent('svg'),
      img: createMotionComponent('img'),
      input: createMotionComponent('input'),
      form: createMotionComponent('form'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
    },
    AnimatePresence: function AnimatePresence(props) { return props.children || null; },
    useReducedMotion: function() { return false; },
    useAnimation: function() { return { start: function() {}, stop: function() {} }; },
    useMotionValue: function(initial) { return { get: function() { return initial; }, set: function() {} }; },
    useTransform: function(value, input, output) { return value; },
  };
});
