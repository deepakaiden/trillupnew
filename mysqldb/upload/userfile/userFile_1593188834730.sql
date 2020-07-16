-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 22, 2020 at 06:38 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `trillup_final`
--

-- --------------------------------------------------------

--
-- Table structure for table `register`
--

CREATE TABLE `register` (
  `id` int(4) NOT NULL,
  `email` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `mobile` text NOT NULL,
  `password` varchar(150) NOT NULL,
  `profile` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `register`
--

INSERT INTO `register` (`id`, `email`, `username`, `mobile`, `password`, `profile`) VALUES
(1, 'prasad.pollard@gmail.com', 'prasadpollard', '0987654329', '$2a$10$jacMTLnhivJMLVQcjfUZr..dTXeqWpxzMACL8GjJnwl3DAa6fMJYe', ''),
(4, 'sasi@gmail.com', 'sasi', '0987654321', '$2a$10$my/JKymLvj8LFqS6Fw.kweA3F4.i7kJGpwNeJK2IzRwdUPLELMCLu', ''),
(5, 'naveen@gmail.com', 'naveen', '1234567890', '$2a$10$0gTZHr5CspDC1SLDAlszteouv6jhXBckp8cvdwfkBmk5EAVReoY36', './src/assets/profile1592827149761intercom.jpg'),
(8, 'naveen@rayies.com', 'naveen', '0987654311', '$2a$10$7kfwc1GF/LZyHK09kCD89OPvLjU0uTt/Xyb70TPYenmBeFw8VPxtW', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `register`
--
ALTER TABLE `register`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `register`
--
ALTER TABLE `register`
  MODIFY `id` int(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
