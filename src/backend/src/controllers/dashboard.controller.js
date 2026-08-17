import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";

// =============================
// GET DASHBOARD STATS (Admin)
// GET /api/dashboard/stats
// =============================
export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();

        // ── Current month window ──────────────────────────────
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const endOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
        );

        // ── Aggregate totals in parallel ──────────────────────
        const [
            // Revenue: sum of finalAmount from paid orders
            revenueAgg,
            lastMonthRevenueAgg,

            // Orders
            totalOrders,
            thisMonthOrders,
            lastMonthOrders,

            // Users (non-admin)
            totalUsers,
            thisMonthUsers,
            lastMonthUsers,

            // Products (active)
            totalProducts,

            // Recent orders (last 8, paid only shown first)
            recentOrders,

            // Order status breakdown
            orderStatusCounts,
        ] = await Promise.all([
            // Current total revenue (all time, paid)
            Order.aggregate([
                { $match: { paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$finalAmount" } } },
            ]),

            // Last month revenue
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: "paid",
                        createdAt: {
                            $gte: startOfLastMonth,
                            $lte: endOfLastMonth,
                        },
                    },
                },
                { $group: { _id: null, total: { $sum: "$finalAmount" } } },
            ]),

            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.countDocuments({
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            }),

            User.countDocuments({ role: "user" }),
            User.countDocuments({
                role: "user",
                createdAt: { $gte: startOfMonth },
            }),
            User.countDocuments({
                role: "user",
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            }),

            Product.countDocuments({ isActive: true }),

            Order.find()
                .populate("user", "full_name email")
                .sort({ createdAt: -1 })
                .limit(8)
                .select(
                    "_id user items finalAmount orderStatus paymentStatus createdAt"
                ),

            Order.aggregate([
                {
                    $group: {
                        _id: "$orderStatus",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // ── Revenue this month ────────────────────────────────
        const thisMonthRevenueAgg = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    createdAt: { $gte: startOfMonth },
                },
            },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]);

        // ── Helper: % change ──────────────────────────────────
        function pctChange(current, previous) {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(
                (((current - previous) / previous) * 100).toFixed(1)
            );
        }

        const totalRevenue = revenueAgg[0]?.total ?? 0;
        const thisMonthRevenue = thisMonthRevenueAgg[0]?.total ?? 0;
        const lastMonthRevenue = lastMonthRevenueAgg[0]?.total ?? 0;
        const revenueChange = pctChange(thisMonthRevenue, lastMonthRevenue);
        const ordersChange = pctChange(thisMonthOrders, lastMonthOrders);
        const usersChange = pctChange(thisMonthUsers, lastMonthUsers);

        // ── Order status map ──────────────────────────────────
        const statusMap = {};
        orderStatusCounts.forEach(({ _id, count }) => {
            if (_id) statusMap[_id] = count;
        });

        return res.status(200).json({
            success: true,
            stats: {
                revenue: {
                    total: totalRevenue,
                    thisMonth: thisMonthRevenue,
                    lastMonth: lastMonthRevenue,
                    change: revenueChange,
                    up: revenueChange >= 0,
                },
                orders: {
                    total: totalOrders,
                    thisMonth: thisMonthOrders,
                    lastMonth: lastMonthOrders,
                    change: ordersChange,
                    up: ordersChange >= 0,
                    byStatus: statusMap, // { placed, processing, shipped, delivered, cancelled }
                },
                users: {
                    total: totalUsers,
                    thisMonth: thisMonthUsers,
                    lastMonth: lastMonthUsers,
                    change: usersChange,
                    up: usersChange >= 0,
                },
                products: {
                    total: totalProducts,
                },
            },
            recentOrders,
        });
    } catch (error) {
        console.error("getDashboardStats error:", error);
        return res.status(500).json({
            message: "Error fetching dashboard stats",
        });
    }
};
